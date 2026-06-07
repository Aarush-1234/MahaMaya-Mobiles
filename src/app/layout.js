import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import { ShopProvider } from "../context/ShopContext";
import CartDrawer from "../components/CartDrawer";
import { supabase } from "../lib/supabase";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export async function generateMetadata() {
  try {
    const { data } = await supabase.from('settings').select('shop_name').limit(1);
    const shopName = data?.[0]?.shop_name || "MahaMaya Mobiles";
    return {
      title: `${shopName} | Premium Mobile Covers & Accessories`,
      description: `Browse premium mobile covers, tempered glass, chargers, and accessories at ${shopName}. Easy catalog viewing and quick WhatsApp ordering with local delivery.`,
    };
  } catch (error) {
    return {
      title: "MahaMaya Mobiles | Premium Mobile Covers & Accessories",
      description: "Browse premium mobile covers, tempered glass, chargers, and accessories. Easy catalog viewing and quick WhatsApp ordering with local delivery.",
    };
  }
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png?v=3" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=3" />
      </head>
      <body>
        <ShopProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
