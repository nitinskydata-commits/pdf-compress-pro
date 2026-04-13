const { PDFDocument } = require('pdf-lib');

async function compressPDF(fileBuffer, compressionLevel) {
    try {
        // Load PDF
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const originalSize = fileBuffer.length;
        
        // Create new document for compression
        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => newDoc.addPage(page));
        
        // Compression settings
        let saveOptions;
        switch(compressionLevel) {
            case 'low':
                saveOptions = {
                    useObjectStreams: true,
                    objectsPerTick: 100,
                    compress: true
                };
                break;
            case 'medium':
                saveOptions = {
                    useObjectStreams: true,
                    objectsPerTick: 60,
                    compress: true
                };
                break;
            case 'high':
                saveOptions = {
                    useObjectStreams: false,
                    objectsPerTick: 30,
                    compress: true
                };
                break;
            default:
                saveOptions = {
                    useObjectStreams: true,
                    objectsPerTick: 80,
                    compress: true
                };
        }
        
        let compressedBytes = await newDoc.save(saveOptions);
        
        // For high compression, do second pass if beneficial
        if (compressionLevel === 'high' && compressedBytes.length > originalSize * 0.5) {
            const secondPass = await PDFDocument.load(compressedBytes);
            const moreCompressed = await secondPass.save({
                useObjectStreams: false,
                objectsPerTick: 20,
                compress: true
            });
            if (moreCompressed.length < compressedBytes.length) {
                compressedBytes = moreCompressed;
            }
        }
        
        return compressedBytes;
    } catch (error) {
        console.error('Compression error:', error);
        throw error;
    }
}

module.exports = { compressPDF };