'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon, Atom, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { MUSEUM_INFO, NAVIGATION_MENU } from '@/lib/constants';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Explore',
		links: [
			{ title: 'Exhibitions', href: '/exhibitions' },
			{ title: 'Planetarium Shows', href: '/shows' },
			{ title: 'Events', href: '/events' },
			{ title: 'Gallery', href: '/gallery' },
		],
	},
	{
		label: 'Visit',
		links: [
			{ title: 'Plan Your Visit', href: '/plan-visit' },
			{ title: 'Timings & Tickets', href: '/plan-visit#timings' },
			{ title: 'Group Bookings', href: '/plan-visit#groups' },
			{ title: 'Accessibility', href: '/plan-visit#accessibility' },
		],
	},
	{
		label: 'Learn',
		links: [
			{ title: 'About Us', href: '/about' },
			{ title: 'Educational Programs', href: '/about#programs' },
			{ title: 'Research', href: '/about#research' },
			{ title: 'FAQ', href: '/plan-visit#faq' },
		],
	},
	{
		label: 'Connect',
		links: [
			{ title: 'Facebook', href: MUSEUM_INFO.socialMedia.facebook, icon: FacebookIcon },
			{ title: 'Instagram', href: MUSEUM_INFO.socialMedia.instagram, icon: InstagramIcon },
			{ title: 'YouTube', href: MUSEUM_INFO.socialMedia.youtube, icon: YoutubeIcon },
			{ title: 'LinkedIn', href: '#', icon: LinkedinIcon },
		],
	},
];

export function Footer() {
	return (
		<footer className="md:rounded-t-6xl relative w-full flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
			<div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="container mx-auto max-w-7xl">
				<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
					<AnimatedContainer className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 flex items-center justify-center bg-primary rounded-full">
								<Atom className="w-6 h-6 text-white" />
							</div>
							<div>
								<div className="font-bold text-lg">{MUSEUM_INFO.shortName}</div>
								<div className="text-xs opacity-80">Science Centre</div>
							</div>
						</div>
						<p className="text-muted-foreground mt-8 text-sm md:mt-0">
							Inspiring scientific curiosity and discovery for all ages through interactive exhibitions and educational programs.
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<MapPin className="w-4 h-4 text-muted-foreground" />
								<span className="text-muted-foreground">
									{MUSEUM_INFO.address.street}, {MUSEUM_INFO.address.city}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Phone className="w-4 h-4 text-muted-foreground" />
								<span className="text-muted-foreground">{MUSEUM_INFO.phone}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Mail className="w-4 h-4 text-muted-foreground" />
								<span className="text-muted-foreground">{MUSEUM_INFO.email}</span>
							</div>
						</div>
						<p className="text-muted-foreground text-sm">
							© {new Date().getFullYear()} {MUSEUM_INFO.name}. All rights reserved.
						</p>
					</AnimatedContainer>

					<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
						{footerLinks.map((section, index) => (
							<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
								<div className="mb-10 md:mb-0">
									<h3 className="text-xs font-semibold">{section.label}</h3>
									<ul className="text-muted-foreground mt-4 space-y-2 text-sm">
										{section.links.map((link) => (
											<li key={link.title}>
												<Link
													href={link.href}
													className="hover:text-foreground inline-flex items-center transition-all duration-300"
												>
													{link.icon && <link.icon className="me-1 size-4" />}
													{link.title}
												</Link>
											</li>
										))}
									</ul>
								</div>
							</AnimatedContainer>
						))}
					</div>
				</div>

				{/* Bottom Links */}
				<div className="mt-8 pt-6 border-t border-border/50 w-full">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
						<div className="flex gap-6">
							<Link href="/privacy" className="hover:text-foreground transition-colors">
								Privacy Policy
							</Link>
							<Link href="/terms" className="hover:text-foreground transition-colors">
								Terms of Service
							</Link>
							<Link href="/sitemap" className="hover:text-foreground transition-colors">
								Sitemap
							</Link>
						</div>
						<div className="text-xs opacity-75">
							Open 9:30 AM - 5:30 PM (Closed Mondays)
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
