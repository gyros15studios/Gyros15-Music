import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ID3v2.3 tag writer
function createId3Tag(metadata: {
  title: string;
  artist: string;
  album: string;
  trackNumber: number;
  totalTracks: number;
  albumArt?: Uint8Array;
}): Uint8Array {
  const frames: Uint8Array[] = [];
  
  // Helper to create text frame
  const createTextFrame = (frameId: string, text: string): Uint8Array => {
    const textBytes = new TextEncoder().encode(text);
    const frameSize = 1 + textBytes.length; // encoding byte + text
    const frame = new Uint8Array(10 + frameSize);
    
    // Frame ID (4 bytes)
    for (let i = 0; i < 4; i++) {
      frame[i] = frameId.charCodeAt(i);
    }
    
    // Frame size (4 bytes, big endian)
    frame[4] = (frameSize >> 24) & 0xFF;
    frame[5] = (frameSize >> 16) & 0xFF;
    frame[6] = (frameSize >> 8) & 0xFF;
    frame[7] = frameSize & 0xFF;
    
    // Flags (2 bytes)
    frame[8] = 0;
    frame[9] = 0;
    
    // Encoding (ISO-8859-1)
    frame[10] = 0;
    
    // Text content
    frame.set(textBytes, 11);
    
    return frame;
  };
  
  // Create text frame with UTF-16 encoding for better character support
  const createUtf16TextFrame = (frameId: string, text: string): Uint8Array => {
    // UTF-16 LE with BOM
    const bom = new Uint8Array([0xFF, 0xFE]);
    const textBytes = new Uint8Array(text.length * 2);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      textBytes[i * 2] = code & 0xFF;
      textBytes[i * 2 + 1] = (code >> 8) & 0xFF;
    }
    
    const frameSize = 1 + bom.length + textBytes.length; // encoding + BOM + text
    const frame = new Uint8Array(10 + frameSize);
    
    // Frame ID
    for (let i = 0; i < 4; i++) {
      frame[i] = frameId.charCodeAt(i);
    }
    
    // Frame size (big endian)
    frame[4] = (frameSize >> 24) & 0xFF;
    frame[5] = (frameSize >> 16) & 0xFF;
    frame[6] = (frameSize >> 8) & 0xFF;
    frame[7] = frameSize & 0xFF;
    
    // Flags
    frame[8] = 0;
    frame[9] = 0;
    
    // Encoding (UTF-16)
    frame[10] = 1;
    
    // BOM
    frame.set(bom, 11);
    
    // Text
    frame.set(textBytes, 11 + bom.length);
    
    return frame;
  };
  
  // Title (TIT2)
  frames.push(createUtf16TextFrame('TIT2', metadata.title));
  
  // Artist (TPE1)
  frames.push(createUtf16TextFrame('TPE1', metadata.artist));
  
  // Album (TALB)
  frames.push(createUtf16TextFrame('TALB', metadata.album));
  
  // Track number (TRCK) - format: "track/total"
  frames.push(createTextFrame('TRCK', `${metadata.trackNumber}/${metadata.totalTracks}`));
  
  // Album art (APIC) if provided
  if (metadata.albumArt && metadata.albumArt.length > 0) {
    const mimeType = 'image/jpeg';
    const mimeBytes = new TextEncoder().encode(mimeType);
    
    // APIC frame structure:
    // encoding (1) + mime type + null (1) + picture type (1) + description + null (1) + picture data
    const frameContent = new Uint8Array(1 + mimeBytes.length + 1 + 1 + 1 + metadata.albumArt.length);
    let offset = 0;
    
    // Encoding (ISO-8859-1)
    frameContent[offset++] = 0;
    
    // MIME type
    frameContent.set(mimeBytes, offset);
    offset += mimeBytes.length;
    
    // Null terminator for MIME
    frameContent[offset++] = 0;
    
    // Picture type (3 = front cover)
    frameContent[offset++] = 3;
    
    // Description (empty, null terminated)
    frameContent[offset++] = 0;
    
    // Picture data
    frameContent.set(metadata.albumArt, offset);
    
    const frameSize = frameContent.length;
    const apicFrame = new Uint8Array(10 + frameSize);
    
    // Frame ID
    apicFrame[0] = 'A'.charCodeAt(0);
    apicFrame[1] = 'P'.charCodeAt(0);
    apicFrame[2] = 'I'.charCodeAt(0);
    apicFrame[3] = 'C'.charCodeAt(0);
    
    // Frame size
    apicFrame[4] = (frameSize >> 24) & 0xFF;
    apicFrame[5] = (frameSize >> 16) & 0xFF;
    apicFrame[6] = (frameSize >> 8) & 0xFF;
    apicFrame[7] = frameSize & 0xFF;
    
    // Flags
    apicFrame[8] = 0;
    apicFrame[9] = 0;
    
    // Content
    apicFrame.set(frameContent, 10);
    
    frames.push(apicFrame);
  }
  
  // Calculate total size of all frames
  const totalFrameSize = frames.reduce((sum, frame) => sum + frame.length, 0);
  
  // Create ID3v2.3 header (10 bytes)
  const header = new Uint8Array(10);
  header[0] = 'I'.charCodeAt(0);
  header[1] = 'D'.charCodeAt(0);
  header[2] = '3'.charCodeAt(0);
  header[3] = 3; // Version 2.3
  header[4] = 0; // Revision
  header[5] = 0; // Flags
  
  // Size (syncsafe integer - 4 bytes, 7 bits each)
  const size = totalFrameSize;
  header[6] = (size >> 21) & 0x7F;
  header[7] = (size >> 14) & 0x7F;
  header[8] = (size >> 7) & 0x7F;
  header[9] = size & 0x7F;
  
  // Combine header and frames
  const id3Tag = new Uint8Array(10 + totalFrameSize);
  id3Tag.set(header, 0);
  
  let offset = 10;
  for (const frame of frames) {
    id3Tag.set(frame, offset);
    offset += frame.length;
  }
  
  return id3Tag;
}

// Check if file already has ID3 tag and get its size
function getExistingId3Size(data: Uint8Array): number {
  if (data[0] === 'I'.charCodeAt(0) && 
      data[1] === 'D'.charCodeAt(0) && 
      data[2] === '3'.charCodeAt(0)) {
    // Syncsafe integer
    const size = ((data[6] & 0x7F) << 21) |
                 ((data[7] & 0x7F) << 14) |
                 ((data[8] & 0x7F) << 7) |
                 (data[9] & 0x7F);
    return 10 + size;
  }
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, title, artist, album, trackNumber, totalTracks, albumArtUrl } = await req.json();

    if (!fileUrl || !title || !artist || !album) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the MP3 file
    const mp3Response = await fetch(fileUrl);
    if (!mp3Response.ok) {
      throw new Error('Failed to fetch MP3 file');
    }
    const mp3Data = new Uint8Array(await mp3Response.arrayBuffer());

    // Fetch album art if provided
    let albumArt: Uint8Array | undefined;
    if (albumArtUrl) {
      try {
        const artResponse = await fetch(albumArtUrl);
        if (artResponse.ok) {
          albumArt = new Uint8Array(await artResponse.arrayBuffer());
        }
      } catch (e) {
        console.error('Failed to fetch album art:', e);
      }
    }

    // Create ID3 tag
    const id3Tag = createId3Tag({
      title,
      artist,
      album,
      trackNumber: trackNumber || 1,
      totalTracks: totalTracks || 1,
      albumArt,
    });

    // Remove existing ID3 tag if present
    const existingId3Size = getExistingId3Size(mp3Data);
    const mp3AudioData = mp3Data.slice(existingId3Size);

    // Combine new ID3 tag with audio data
    const result = new Uint8Array(id3Tag.length + mp3AudioData.length);
    result.set(id3Tag, 0);
    result.set(mp3AudioData, id3Tag.length);

    // Generate filename
    const trackNum = String(trackNumber || 1).padStart(2, '0');
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_');
    const filename = `${trackNum} - ${safeTitle}.mp3`;

    return new Response(result, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error processing MP3:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
