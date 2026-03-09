import { GITHUB_REPO_URL, DISCORD_INVITE_URL } from "@/lib/constants";
import { GithubIcon, DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export function Footer() {
	return (
		<div className="mt-4">
			<footer className="border-t py-6 md:py-0 bg-card/20">
				<div className="flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 mx-auto">
					<p className="text-sm text-muted-foreground text-center md:text-left">
						© {new Date().getFullYear()} YourChoice. All rights reserved.
					</p>
					<div className="flex items-center gap-6">
						<a href="https://nguyen-nhon-hau.vercel.app/vi" target="_blank" rel="noreferrer">
							<Button
								variant="default"
								size="sm"
								className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
							>
								<Briefcase className="w-4 h-4 mr-2" />
								Hire Me
							</Button>
						</a>
						<a
							href={GITHUB_REPO_URL}
							target="_blank"
							rel="noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<GithubIcon className="h-5 w-5" />
							<span className="sr-only">GitHub</span>
						</a>
						<a
							href={DISCORD_INVITE_URL}
							target="_blank"
							rel="noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<DiscordIcon className="h-5 w-5" />
							<span className="sr-only">Discord</span>
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
