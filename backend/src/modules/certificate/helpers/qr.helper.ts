import QRCode from "qrcode";

export async function generateQrBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    margin: 1,
    width: 150,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
