import { Link } from "react-router";
import { cn } from "~/lib/utils";

export default function Logo({
	classname,
	size,
	showLogoText = false,
}: {
	classname?: string;
	size?: string;
	showLogoText?: boolean;
}) {
	return (
		<Link to="/" className="flex gap-2 items-center w-fit">
			<img
				src="https://res.cloudinary.com/ceenobi/image/upload/e_bgremoval,f_auto,q_auto/v1787865127/tsaInterns/avatars/Gemini_Generated_Image_pgm98mpgm98mpgm9_qg2g5v.png"
				alt="Logo"
				className={cn(
					classname,
					"text-mainBlue dark:text-darkBlue",
					size ?? "size-9",
				)}
			/>
			{showLogoText && (
				<h2
					className={`${classname} text-base font-semibold tracking-tight text-mainDark dark:text-white`}
				>
					TSA Intern Hub
				</h2>
			)}
		</Link>
	);
}
