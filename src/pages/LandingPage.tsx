import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Tag, Collapse, theme as antTheme } from "antd";
import {
	QrcodeOutlined,
	ArrowRightOutlined,
	LeftOutlined,
	DashboardOutlined,
	FileTextOutlined,
	ThunderboltOutlined,
	SafetyCertificateOutlined,
	TeamOutlined,
	CheckCircleOutlined,
	ShopOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

/* ─── is-in-view hook ─────────────────────────────────────────────── */
function useInView(ref: React.RefObject<Element>, threshold = 0.15) {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const obs = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) setVisible(true);
			},
			{ threshold },
		);
		if (ref.current) obs.observe(ref.current);
		return () => obs.disconnect();
	}, [ref, threshold]);
	return visible;
}

/* ─── animated number counter ─────────────────────────────────────── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
	const [val, setVal] = useState(0);
	const ref = useRef<HTMLSpanElement>(null);
	const visible = useInView(ref as React.RefObject<Element>);
	useEffect(() => {
		if (!visible) return;
		const step = Math.max(end / 60, 1);
		let cur = 0;
		const id = setInterval(() => {
			cur = Math.min(cur + step, end);
			setVal(Math.round(cur));
			if (cur >= end) clearInterval(id);
		}, 16);
		return () => clearInterval(id);
	}, [visible, end]);
	return (
		<span ref={ref}>
			{val.toLocaleString()}
			{suffix}
		</span>
	);
}

/* ─── scroll-triggered fade-in ────────────────────────────────────── */
function FadeIn({
	children,
	delay = 0,
	style = {},
}: {
	children: React.ReactNode;
	delay?: number;
	style?: React.CSSProperties;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const visible = useInView(ref as React.RefObject<Element>);
	return (
		<div
			ref={ref}
			style={{
				opacity: visible ? 1 : 0,
				transform: visible ? "translateY(0)" : "translateY(24px)",
				transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
				...style,
			}}
		>
			{children}
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export function LandingPage() {
	const [isBusinessView, setIsBusinessView] = useState(false);
	const navigate = useNavigate();
	const { token } = antTheme.useToken();
	const isDark =
		token.colorBgBase !== "#ffffff" && token.colorBgBase !== "#fff";

	const orange = "#f97316";
	const orangeLight = isDark
		? "rgba(249,115,22,0.12)"
		: "rgba(249,115,22,0.08)";
	const orangeBorder = "rgba(249,115,22,0.25)";
	const bg = isDark ? "#090e1a" : "#f9f6f2";
	const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
	const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
	const muted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";
	const navBg = isDark ? "rgba(9,14,26,0.88)" : "rgba(249,246,242,0.88)";

	/* ── page data ── */
	const features = [
		{
			icon: <QrcodeOutlined />,
			title: "QR Table Ordering",
			desc: "Every table gets its own QR code. Customers scan, browse your menu, and place orders - no app, no waiter needed.",
		},
		{
			icon: <DashboardOutlined />,
			title: "Live Kitchen Board",
			desc: "Kanban-style order screen for your kitchen staff. New orders appear instantly with audio alerts so nothing gets missed.",
		},
		{
			icon: <FileTextOutlined />,
			title: "Billing & Payments",
			desc: "Generate itemised bills in one tap. Accept Cash, Card, or UPI - whichever your customers prefer.",
		},
		{
			icon: <ThunderboltOutlined />,
			title: "Real-Time WebSockets",
			desc: "Orders reach the kitchen the moment they're placed. No page refresh, no polling - purely live.",
		},
		{
			icon: <TeamOutlined />,
			title: "Staff Access Control",
			desc: "Different roles for different staff. Managers see everything; kitchen staff see only what they need.",
		},
		{
			icon: <ShopOutlined />,
			title: "Full Menu Control",
			desc: "Add categories, items, prices, and photos. Toggle availability on the fly without touching a printer.",
		},
	];

	const steps = [
		{
			n: "01",
			title: "Set Up Your Tables",
			body: "Create your table layout and generate a unique QR code for each one. Print and place - done in minutes.",
		},
		{
			n: "02",
			title: "Build Your Digital Menu",
			body: "Add your dishes with prices, photos, and veg/non-veg tags. Update it any time, live immediately.",
		},
		{
			n: "03",
			title: "Guests Scan & Order",
			body: "Customers scan the table QR, browse the menu, and place their order without calling anyone over.",
		},
		{
			n: "04",
			title: "Kitchen Cooks, You Bill",
			body: "The order hits the kitchen board instantly. Mark it ready, generate the bill, collect payment, close the table.",
		},
	];

	const stats = [
		{ val: 0, suffix: " sec", label: "Order delay (WebSocket)" },
		{ val: 100, suffix: "%", label: "No customer login needed" },
		{ val: 3, suffix: " taps", label: "To generate a bill" },
		{ val: 10, suffix: " min", label: "To go live from scratch" },
	];

	const faqs = [
		{
			q: "Do customers need to install an app or create an account?",
			a: "No. They scan the QR code on the table and the menu opens in their browser. Nothing to install, nothing to sign up for.",
		},
		{
			q: "What happens if a customer scans from the wrong table?",
			a: "Each QR code is tied to a specific table, so orders always arrive tagged to the correct table in your kitchen dashboard.",
		},
		{
			q: "Which payment methods does the billing system support?",
			a: "Cash, Card, and UPI are all supported. You record whichever method the customer pays with at checkout.",
		},
		{
			q: "Can the kitchen see all orders across every table at once?",
			a: "Yes. The kitchen board shows all active orders in real time, organised by table with timestamps and status controls.",
		},
		{
			q: "Can I update the menu while the restaurant is open?",
			a: "Absolutely. Any change you make - price, availability, new item - is live immediately for the next customer who scans.",
		},
	];

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100vh",
				overflow: "hidden",
				background: bg,
			}}
		>
			<style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

			{/* ── sliding wrapper ── */}
			<div
				style={{
					display: "flex",
					width: "200%",
					height: "100%",
					transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
					transform: isBusinessView ? "translateX(-50%)" : "translateX(0)",
				}}
			>
				{/* ═══════════════════════════════════════════════
            PANE 1 - Customer "Scan to Order"
        ═══════════════════════════════════════════════ */}
				<div
					style={{
						width: "50%",
						height: "100%",
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						background: bg,
						position: "relative",
					}}
				>
					{/* background decoration */}
					<div
						style={{
							position: "absolute",
							inset: 0,
							pointerEvents: "none",
							overflow: "hidden",
						}}
					>
						<div
							style={{
								position: "absolute",
								top: "-15%",
								right: "-10%",
								width: 500,
								height: 500,
								borderRadius: "50%",
								background:
									"radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 68%)",
							}}
						/>
						<div
							style={{
								position: "absolute",
								bottom: "-8%",
								left: "-8%",
								width: 300,
								height: 300,
								borderRadius: "50%",
								background:
									"radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
							}}
						/>
						<svg
							style={{
								position: "absolute",
								inset: 0,
								width: "100%",
								height: "100%",
								opacity: 0.035,
							}}
						>
							<defs>
								<pattern
									id="g"
									width="48"
									height="48"
									patternUnits="userSpaceOnUse"
								>
									<path
										d="M 48 0 L 0 0 0 48"
										fill="none"
										stroke={isDark ? "#fff" : "#000"}
										strokeWidth="0.5"
									/>
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill="url(#g)" />
						</svg>
					</div>

					<div
						style={{
							position: "relative",
							zIndex: 1,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 28,
							maxWidth: 380,
							padding: "0 24px",
							textAlign: "center",
						}}
					>
						{/* floating icon */}
						<div
							style={{
								position: "relative",
								animation: "float 4s ease-in-out infinite",
							}}
						>
							<div
								style={{
									width: 88,
									height: 88,
									borderRadius: 24,
									background: isDark
										? "rgba(249,115,22,0.15)"
										: "rgba(249,115,22,0.1)",
									border: `1.5px solid ${orangeBorder}`,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<QrcodeOutlined style={{ fontSize: 40, color: orange }} />
							</div>
							<div
								style={{
									position: "absolute",
									top: -4,
									right: -4,
									width: 20,
									height: 20,
									borderRadius: "50%",
									background: orange,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<CheckCircleOutlined style={{ fontSize: 11, color: "#fff" }} />
							</div>
						</div>

						{/* live badge */}
						<div
							style={{
								display: "inline-flex",
								alignItems: "center",
								gap: 8,
								background: orangeLight,
								border: `1px solid ${orangeBorder}`,
								borderRadius: 100,
								padding: "5px 14px",
							}}
						>
							<div
								style={{
									width: 7,
									height: 7,
									borderRadius: "50%",
									background: orange,
									animation: "pulse 2s infinite",
								}}
							/>
							<Text
								style={{
									fontSize: 12,
									color: orange,
									fontWeight: 600,
									letterSpacing: 0.6,
									textTransform: "uppercase",
								}}
							>
								Ordering Open
							</Text>
						</div>

						<Title
							level={2}
							style={{
								margin: 0,
								fontSize: 30,
								fontWeight: 800,
								lineHeight: 1.2,
								color: token.colorTextBase,
							}}
						>
							Scan. Browse. Order.
							<br />
							<span style={{ color: orange }}>It's that simple.</span>
						</Title>

						<Paragraph
							style={{
								fontSize: 16,
								color: muted,
								lineHeight: 1.75,
								margin: 0,
							}}
						>
							Point your camera at the QR code on your table to view the menu
							and place your order - no app, no login, no waiting.
						</Paragraph>

						{/* QR graphic */}
						<div
							style={{
								background: "#fff",
								borderRadius: 18,
								padding: 18,
								border: "1.5px solid rgba(0,0,0,0.07)",
								display: "inline-flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 10,
							}}
						>
							<svg
								width="100"
								height="100"
								viewBox="0 0 100 100"
								xmlns="http://www.w3.org/2000/svg"
							>
								<rect
									x="5"
									y="5"
									width="28"
									height="28"
									rx="4"
									fill="none"
									stroke="#111"
									strokeWidth="3"
								/>
								<rect x="11" y="11" width="16" height="16" rx="2" fill="#111" />
								<rect
									x="67"
									y="5"
									width="28"
									height="28"
									rx="4"
									fill="none"
									stroke="#111"
									strokeWidth="3"
								/>
								<rect x="73" y="11" width="16" height="16" rx="2" fill="#111" />
								<rect
									x="5"
									y="67"
									width="28"
									height="28"
									rx="4"
									fill="none"
									stroke="#111"
									strokeWidth="3"
								/>
								<rect x="11" y="73" width="16" height="16" rx="2" fill="#111" />
								{[38, 44, 50, 56, 62].map((x, xi) =>
									[5, 11, 17, 23].map((y, yi) => (
										<rect
											key={`t${xi}${yi}`}
											x={x}
											y={y}
											width="4"
											height="4"
											rx="1"
											fill="#111"
											opacity={(xi + yi) % 3 === 0 ? 0.15 : 1}
										/>
									)),
								)}
								{[0, 1, 2, 3, 4, 5].map((yi) =>
									[0, 1, 2, 3, 4].map((xi) => (
										<rect
											key={`b${xi}${yi}`}
											x={38 + xi * 6}
											y={38 + yi * 6}
											width="4"
											height="4"
											rx="1"
											fill={
												(xi === 1 && yi === 2) || (xi === 3 && yi === 0)
													? orange
													: "#111"
											}
											opacity={(xi * yi) % 5 === 0 ? 0.2 : 1}
										/>
									)),
								)}
							</svg>
							<Text
								style={{
									fontSize: 11,
									color: "#bbb",
									fontFamily: "monospace",
									letterSpacing: 1,
								}}
							>
								SCAN · TABLE 07
							</Text>
						</div>
					</div>

					{/* owner hint */}
					<button
						onClick={() => setIsBusinessView(true)}
						style={{
							position: "absolute",
							bottom: 28,
							left: "50%",
							transform: "translateX(-50%)",
							background: "transparent",
							border: "none",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 6,
							color: muted,
							fontSize: 13,
							padding: "8px 16px",
							borderRadius: 8,
							transition: "color 0.2s",
						}}
						onMouseEnter={(e) => (e.currentTarget.style.color = orange)}
						onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
					>
						Restaurant owner? <ArrowRightOutlined style={{ fontSize: 11 }} />
					</button>
				</div>

				{/* ═══════════════════════════════════════════════
            PANE 2 - Owner info / admin access
        ═══════════════════════════════════════════════ */}
				<div
					style={{
						width: "50%",
						height: "100%",
						overflowY: "auto",
						background: bg,
					}}
				>
					{/* sticky nav */}
					<nav
						style={{
							position: "sticky",
							top: 0,
							zIndex: 100,
							background: navBg,
							backdropFilter: "blur(14px)",
							borderBottom: `1px solid ${cardBorder}`,
							padding: "0 28px",
							height: 62,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
						}}
					>
						<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
							<button
								onClick={() => setIsBusinessView(false)}
								style={{
									background: "transparent",
									border: "none",
									cursor: "pointer",
									color: muted,
									padding: 0,
									display: "flex",
									alignItems: "center",
								}}
							>
								<LeftOutlined style={{ fontSize: 12 }} />
							</button>
							<div
								style={{
									width: 1,
									height: 20,
									background: cardBorder,
									margin: "0 10px",
								}}
							/>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<div
									style={{
										width: 28,
										height: 28,
										borderRadius: 8,
										background: orange,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<QrcodeOutlined style={{ fontSize: 14, color: "#fff" }} />
								</div>
								<Text
									strong
									style={{ fontSize: 15, color: token.colorTextBase }}
								>
									DineQR
								</Text>
							</div>
						</div>

						<div style={{ display: "flex", gap: 28, alignItems: "center" }}>
							{[
								["Features", "#features"],
								["How It Works", "#how-it-works"],
								["FAQ", "#faq"],
							].map(([label, href]) => (
								<a
									key={label}
									href={href}
									style={{
										fontSize: 13,
										color: muted,
										textDecoration: "none",
										fontWeight: 500,
									}}
									onMouseEnter={(e) => (e.currentTarget.style.color = orange)}
									onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
								>
									{label}
								</a>
							))}
							<Button
								type="primary"
								size="small"
								onClick={() => navigate("/admin/login")}
								style={{
									borderRadius: 8,
									fontWeight: 600,
									background: orange,
									borderColor: orange,
									fontSize: 13,
								}}
							>
								Admin Login
							</Button>
						</div>
					</nav>

					<div
						style={{ maxWidth: 720, margin: "0 auto", padding: "0 28px 80px" }}
					>
						{/* Hero */}
						<section style={{ padding: "76px 0 60px", textAlign: "center" }}>
							<FadeIn>
								<Title
									level={1}
									style={{
										fontSize: "clamp(30px, 4.5vw, 52px)",
										fontWeight: 800,
										lineHeight: 1.1,
										margin: "0 0 20px",
										color: token.colorTextBase,
									}}
								>
									Your restaurant,
									<br />
									running <span style={{ color: orange }}>smarter</span>
								</Title>
							</FadeIn>
							<FadeIn delay={100}>
								<Paragraph
									style={{
										fontSize: 17,
										color: muted,
										maxWidth: 480,
										margin: "0 auto 36px",
										lineHeight: 1.8,
									}}
								>
									QR ordering, live kitchen management, and instant billing -
									purpose-built for your restaurant and your team.
								</Paragraph>
							</FadeIn>
							<FadeIn delay={200}>
								<Button
									type="primary"
									size="large"
									onClick={() => navigate("/admin/login")}
									style={{
										height: 52,
										padding: "0 32px",
										borderRadius: 12,
										fontWeight: 700,
										fontSize: 15,
										background: orange,
										borderColor: orange,
									}}
								>
									Go to Dashboard <ArrowRightOutlined />
								</Button>
							</FadeIn>
						</section>

						{/* Stats strip */}
						<FadeIn>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(4,1fr)",
									gap: 1,
									background: cardBorder,
									borderRadius: 16,
									overflow: "hidden",
									border: `1px solid ${cardBorder}`,
									marginBottom: 80,
								}}
							>
								{stats.map((s) => (
									<div
										key={s.label}
										style={{
											background: cardBg,
											padding: "22px 12px",
											textAlign: "center",
										}}
									>
										<div
											style={{
												fontSize: 26,
												fontWeight: 800,
												color: orange,
												lineHeight: 1,
											}}
										>
											<Counter end={s.val} suffix={s.suffix} />
										</div>
										<Text
											style={{
												fontSize: 11,
												color: muted,
												marginTop: 6,
												display: "block",
												lineHeight: 1.4,
											}}
										>
											{s.label}
										</Text>
									</div>
								))}
							</div>
						</FadeIn>

						{/* Features */}
						<section id="features" style={{ marginBottom: 88 }}>
							<FadeIn>
								<div style={{ textAlign: "center", marginBottom: 44 }}>
									<Tag
										style={{
											marginBottom: 12,
											borderRadius: 100,
											padding: "3px 14px",
											background: orangeLight,
											color: orange,
											border: `1px solid ${orangeBorder}`,
											fontWeight: 600,
											fontSize: 11,
											letterSpacing: 0.5,
										}}
									>
										FEATURES
									</Tag>
									<Title
										level={2}
										style={{
											margin: 0,
											fontSize: 32,
											fontWeight: 800,
											color: token.colorTextBase,
										}}
									>
										Built for how your restaurant actually works
									</Title>
								</div>
							</FadeIn>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
									gap: 14,
								}}
							>
								{features.map((f, i) => (
									<FadeIn key={f.title} delay={i * 55}>
										<div
											style={{
												background: cardBg,
												border: `1px solid ${cardBorder}`,
												borderRadius: 16,
												padding: 22,
												height: "100%",
												transition: "border-color 0.2s, transform 0.2s",
												cursor: "default",
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.borderColor = orangeBorder;
												e.currentTarget.style.transform = "translateY(-2px)";
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.borderColor = cardBorder;
												e.currentTarget.style.transform = "translateY(0)";
											}}
										>
											<div
												style={{
													width: 42,
													height: 42,
													borderRadius: 11,
													background: orangeLight,
													border: `1px solid ${orangeBorder}`,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													marginBottom: 14,
													fontSize: 19,
													color: orange,
												}}
											>
												{f.icon}
											</div>
											<Text
												strong
												style={{
													display: "block",
													marginBottom: 7,
													fontSize: 14,
													color: token.colorTextBase,
												}}
											>
												{f.title}
											</Text>
											<Text
												style={{ fontSize: 13, color: muted, lineHeight: 1.65 }}
											>
												{f.desc}
											</Text>
										</div>
									</FadeIn>
								))}
							</div>
						</section>

						{/* How It Works */}
						<section id="how-it-works" style={{ marginBottom: 88 }}>
							<FadeIn>
								<div style={{ textAlign: "center", marginBottom: 52 }}>
									<Tag
										style={{
											marginBottom: 12,
											borderRadius: 100,
											padding: "3px 14px",
											background: orangeLight,
											color: orange,
											border: `1px solid ${orangeBorder}`,
											fontWeight: 600,
											fontSize: 11,
											letterSpacing: 0.5,
										}}
									>
										HOW IT WORKS
									</Tag>
									<Title
										level={2}
										style={{
											margin: 0,
											fontSize: 32,
											fontWeight: 800,
											color: token.colorTextBase,
										}}
									>
										Live in under 10 minutes
									</Title>
								</div>
							</FadeIn>
							<div style={{ position: "relative" }}>
								<div
									style={{
										position: "absolute",
										left: 27,
										top: 44,
										bottom: 28,
										width: 1.5,
										background: `linear-gradient(to bottom, ${orange} 0%, transparent 100%)`,
										opacity: 0.25,
									}}
								/>
								<div
									style={{ display: "flex", flexDirection: "column", gap: 26 }}
								>
									{steps.map((s, i) => (
										<FadeIn key={s.n} delay={i * 80}>
											<div
												style={{
													display: "flex",
													gap: 20,
													alignItems: "flex-start",
												}}
											>
												<div
													style={{
														width: 56,
														height: 56,
														borderRadius: 16,
														flexShrink: 0,
														background: i === 0 ? orange : cardBg,
														border: `1.5px solid ${i === 0 ? orange : cardBorder}`,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<Text
														style={{
															fontSize: 12,
															fontWeight: 700,
															color: i === 0 ? "#fff" : orange,
															letterSpacing: 0.5,
														}}
													>
														{s.n}
													</Text>
												</div>
												<div style={{ paddingTop: 11 }}>
													<Text
														strong
														style={{
															display: "block",
															fontSize: 15,
															color: token.colorTextBase,
															marginBottom: 5,
														}}
													>
														{s.title}
													</Text>
													<Text
														style={{
															fontSize: 13,
															color: muted,
															lineHeight: 1.7,
														}}
													>
														{s.body}
													</Text>
												</div>
											</div>
										</FadeIn>
									))}
								</div>
							</div>
						</section>

						{/* FAQ */}
						<section id="faq" style={{ marginBottom: 88 }}>
							<FadeIn>
								<div style={{ textAlign: "center", marginBottom: 44 }}>
									<Tag
										style={{
											marginBottom: 12,
											borderRadius: 100,
											padding: "3px 14px",
											background: orangeLight,
											color: orange,
											border: `1px solid ${orangeBorder}`,
											fontWeight: 600,
											fontSize: 11,
											letterSpacing: 0.5,
										}}
									>
										FAQ
									</Tag>
									<Title
										level={2}
										style={{
											margin: 0,
											fontSize: 32,
											fontWeight: 800,
											color: token.colorTextBase,
										}}
									>
										Good questions
									</Title>
								</div>
							</FadeIn>
							<FadeIn delay={80}>
								<Collapse
									bordered={false}
									expandIconPosition="end"
									style={{ background: "transparent" }}
								>
									{faqs.map((f, i) => (
										<Panel
											key={i}
											header={
												<Text
													strong
													style={{ fontSize: 14, color: token.colorTextBase }}
												>
													{f.q}
												</Text>
											}
											style={{
												background: cardBg,
												border: `1px solid ${cardBorder}`,
												borderRadius: 12,
												marginBottom: 10,
												overflow: "hidden",
											}}
										>
											<Text
												style={{ fontSize: 13, color: muted, lineHeight: 1.75 }}
											>
												{f.a}
											</Text>
										</Panel>
									))}
								</Collapse>
							</FadeIn>
						</section>

						{/* CTA banner */}
						<FadeIn>
							<div
								style={{
									borderRadius: 22,
									background: isDark
										? "rgba(249,115,22,0.11)"
										: "rgba(249,115,22,0.06)",
									border: `1px solid ${orangeBorder}`,
									padding: "52px 36px",
									textAlign: "center",
									position: "relative",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										position: "absolute",
										top: -60,
										right: -60,
										width: 220,
										height: 220,
										borderRadius: "50%",
										background:
											"radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
										pointerEvents: "none",
									}}
								/>
								<div
									style={{
										position: "absolute",
										bottom: -40,
										left: -40,
										width: 160,
										height: 160,
										borderRadius: "50%",
										background:
											"radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
										pointerEvents: "none",
									}}
								/>
								<div style={{ position: "relative", zIndex: 1 }}>
									<Title
										level={2}
										style={{
											margin: "0 0 10px",
											fontSize: 28,
											fontWeight: 800,
											color: token.colorTextBase,
										}}
									>
										Your dashboard is waiting
									</Title>
									<Paragraph
										style={{ fontSize: 15, color: muted, margin: "0 0 28px" }}
									>
										Log in to manage your menu, tables, orders, and billing -
										all in one place.
									</Paragraph>
									<Button
										type="primary"
										size="large"
										onClick={() => navigate("/admin/login")}
										style={{
											height: 52,
											padding: "0 36px",
											borderRadius: 13,
											fontWeight: 700,
											fontSize: 15,
											background: orange,
											borderColor: orange,
										}}
									>
										Go to Dashboard <ArrowRightOutlined />
									</Button>
								</div>
							</div>
						</FadeIn>

						{/* Footer */}
						<footer
							style={{
								marginTop: 52,
								paddingTop: 28,
								borderTop: `1px solid ${cardBorder}`,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								flexWrap: "wrap",
								gap: 12,
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<div
									style={{
										width: 24,
										height: 24,
										borderRadius: 7,
										background: orange,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<QrcodeOutlined style={{ fontSize: 12, color: "#fff" }} />
								</div>
								<Text
									strong
									style={{ fontSize: 14, color: token.colorTextBase }}
								>
									DineQR
								</Text>
							</div>
							<Text style={{ fontSize: 12, color: muted }}>
								Your restaurant. Your system.
							</Text>
						</footer>
					</div>
				</div>
			</div>
		</div>
	);
}
