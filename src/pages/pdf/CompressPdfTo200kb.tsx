import PdfCompressor from './PdfCompressor'

export default function CompressPdfTo200kb() {
  return (
    <PdfCompressor
      targetSizeKb={200}
      toolSlug="compress-pdf-to-200kb"
      toolTitle="Compress PDF to 200KB Specifically"
      toolDescription="Specifically compress PDF files under 200KB for government job portals (SSC, UPSC, State PSCs), admission forms, and email uploads while preserving readable text and crystal-clear clarity."
    />
  )
}
