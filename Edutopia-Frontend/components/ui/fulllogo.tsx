import Link from "next/link";
import Image from "next/image";

export default function Fulllogo() {
  return (
    <Link href="/" className="inline-flex shrink-0" aria-label="Edutopia">
      
      <Image src="/images/croppedLogo.png" alt="Edutopia full Logo" width={200} height={150} />
    </Link>
  );
}
