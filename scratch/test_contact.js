async function test() {
  const url = 'https://pdfcompressorpro.pages.dev/contact';
  const res = await fetch(url);
  const text = await res.text();
  console.log(text);
}
test();
