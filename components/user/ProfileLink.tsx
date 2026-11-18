import Image from "next/image";

interface ProfileLinkProps {
  imgUrl: string;
  title: string;
  // Opens in a new tab. Without it, the title is plain text.
  href?: string;
}

// One icon + text line under a profile's name: the portfolio, location
// or join date
const ProfileLink = ({ imgUrl, title, href }: ProfileLinkProps) => (
  <div className="flex-center gap-1">
    {/* Decorative: the text next to it says what it is */}
    <Image src={imgUrl} alt="" width={20} height={20} />

    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="paragraph-medium text-link-100"
      >
        {title}
      </a>
    ) : (
      <p className="paragraph-medium text-dark400_light700">{title}</p>
    )}
  </div>
);

export default ProfileLink;
