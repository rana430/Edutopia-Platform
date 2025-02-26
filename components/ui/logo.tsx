import Link from "next/link";
import Image from "next/image";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex shrink-0" aria-label="Edutopia">
      
      <Image src="/images/edulogo.png" alt="Edutopia Logo" width={50} height={50} />
    </Link>
  );
}
