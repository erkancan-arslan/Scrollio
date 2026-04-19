-- Normalize verbose topic strings to short, sortable labels in generated_video_jobs.
-- Cascades the clean values to generated_videos, kids_content, and videos.

BEGIN;

-- ── MOBILE DEVELOPMENT ───────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Mobile Development' WHERE topic IN (
  'A fundamental explanation of what mobile app development is, its purpose, and why people do it.',
  'A high-level overview of the basic steps involved in building a mobile application.',
  'A high-level, simplified overview of the steps involved in creating and distributing a mobile app.',
  'A simple distinction between the ''frontend'' (what users see and interact with) and the ''backend'' (the hidden data and logic behind it) in a mobile app.',
  'A simple explanation of the two main operating systems (iOS and Android) and their key differences.',
  'An introduction to app stores (App Store, Google Play), what they are, how they work, and their role in getting apps to users.',
  'Defining and comparing native mobile apps (iOS/Android specific) and cross-platform apps (works on both), and their basic differences.',
  'Defining mobile software development and its role in creating apps for phones and tablets.',
  'Discussing the relevance and importance of mobile development in today''s world and potential career paths.',
  'Explaining the fundamental distinctions between native/hybrid mobile apps and mobile-friendly websites.',
  'Explaining the most fundamental visual building blocks of any app: buttons, text labels, and images, and their basic functions.',
  'Exploring the different types of mobile devices and their basic characteristics.',
  'Introducing the role of a mobile software developer and why this job exists.',
  'Introducing the two main mobile operating systems and why they matter for app creation.'
);

-- ── CROSS-PLATFORM DEVELOPMENT ───────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Cross-Platform Development' WHERE topic IN (
  'A comparative analysis of native UI toolkits (e.g., Jetpack Compose, SwiftUI) vs. cross-platform frameworks (e.g., React Native, Flutter) including their architectural differences, performance implications, and development paradigms.',
  'A comparative analysis of the underlying architecture and rendering pipelines of leading cross-platform frameworks (e.g., React Native, Flutter, Kotlin Multiplatform), focusing on optimizing JavaScript/Dart bridge performance, FFI implications, and strategies for seamless native module integration and shared business logic.',
  'Analyzing the trade-offs and advanced architectural considerations when choosing between highly abstracted cross-platform frameworks and developing complex, performance-critical native modules for specific platform features within hybrid applications.',
  'Comparing and contrasting common state management solutions for Flutter applications, focusing on their architectural patterns and use cases.',
  'How to bridge native code (Kotlin/Swift) with cross-platform frameworks like React Native or Flutter for platform-specific functionalities.'
);

-- ── MOBILE ARCHITECTURE ───────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Mobile Architecture' WHERE topic IN (
  'Advanced patterns for integrating backend microservices with mobile clients, including API gateway strategies, service mesh considerations, and eventual consistency models for offline-first applications.',
  'Deep dive into developing for atypical mobile form factors (e.g., foldable, non-standard aspect ratios, haptic feedback integration) and leveraging edge computing paradigms to manage latency and processing for mission-critical mobile applications.',
  'Designing robust mobile applications that prioritize offline functionality and user experience. This includes deep dives into data synchronization strategies, conflict resolution algorithms (e.g., CRDTs), local-first architecture patterns, and the implications of eventual consistency on complex mobile state management.',
  'Exploring common state management patterns and libraries (e.g., Redux, MobX, Provider, BLoC, MVVM) focusing on how they maintain UI consistency and data flow in complex mobile applications.',
  'Exploring different local storage options (SQLite, Room, Core Data, Shared Preferences, Realm) and their trade-offs for various data types and app requirements.',
  'How mobile applications consume and interact with backend RESTful services, covering authentication mechanisms (e.g., OAuth), data serialization/deserialization, and handling asynchronous network requests.',
  'How to translate design mockups into functional UI components, focusing on platform-specific guidelines (Material Design, Human Interface Guidelines) and responsive layouts for various screen sizes and orientations.',
  'Implementing and scaling dependency injection frameworks (e.g., Dagger, Hilt, Swinject) to create highly modular, testable, and maintainable architectures (e.g., Clean Architecture, MVVM-C) for complex, multi-feature mobile applications, including considerations for dynamic feature delivery.'
);

-- ── MOBILE SECURITY ───────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Mobile Security' WHERE topic IN (
  'Comprehensive exploration of advanced mobile API security patterns, including robust implementation of OAuth 2.0 flows (PKCE), OpenID Connect, secure token storage (keychains, SecureSharedPresferences), refresh token rotation, and threat modeling for mobile API interactions.',
  'Deep dive into leveraging secure hardware modules (e.g., Secure Enclave, Android Keystore) for cryptographic operations, advanced biometric integration techniques, and robust protection against sophisticated attack vectors.',
  'Exploration of proactive threat modeling methodologies specific to mobile attack vectors, robust code obfuscation techniques, secure data storage at rest and in transit, and advanced biometry integration, including handling side-channel attacks.',
  'Key principles and implementation strategies for securing mobile applications, such as data encryption, secure API communication, code obfuscation, and protection against common vulnerabilities (e.g., insecure data storage, weak authentication).'
);

-- ── MOBILE PERFORMANCE ────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Mobile Performance' WHERE topic IN (
  'Deep dive into ARC/MRC intricacies, heap/stack analysis, profiling tools (Instruments/Android Studio profiler), and strategies for preventing and identifying complex memory leaks and retain cycles in production-grade mobile applications.'
);

-- ── MOBILE DEVOPS ─────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Mobile DevOps' WHERE topic IN (
  'Constructing sophisticated continuous integration/delivery pipelines for mobile, including UI/UX testing automation, performance profiling, accessibility checks, A/B testing integration, and release train management.',
  'Designing and implementing sophisticated CI/CD pipelines for mobile apps, covering automated testing (unit, integration, UI), code signing, build artifact management, canary releases, A/B testing integration, and rollback strategies across various platforms (fastlane, Bitrise, GitHub Actions for mobile).',
  'How to implement different levels of automated testing for mobile apps, covering unit testing frameworks, integration testing of API calls, and UI testing tools to ensure app stability and functionality.',
  'Operationalizing advanced CI/CD pipelines for large-scale mobile projects, including automated testing (unit, UI, integration, performance, accessibility), release train management, A/B testing frameworks, remote configuration, and strategies for managing app deployments to diverse device fleets and enterprise app stores.'
);

-- ── BGP ROUTING ───────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'BGP Routing' WHERE topic IN (
  'A deep dive into the most common BGP path attributes (e.g., AS_PATH, MED, Local_Pref, Origin) and how they influence the best path selection process for inter-domain routing.',
  'Advanced BGP path selection criteria, attribute manipulation for traffic engineering, and mitigating blackholing/flapping.',
  'Advanced Border Gateway Protocol path selection criteria, focusing on MED, AS_PATH manipulation, and local preference in complex multi-homed inter-domain routing scenarios.',
  'Advanced techniques for influencing inter-domain routing using BGP path attributes (e.g., AS-Path prepending, local preference, MEDs) to achieve specific traffic engineering goals, including inbound/outbound optimization and resilience.'
);

-- ── COMPUTER NETWORKS ─────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Computer Networks' WHERE topic IN (
  'An introduction to the Internet as a global network, how it connects everything, and its basic structure.',
  'Basic explanation of an IP address (what it is, why it''s needed) and its role in identifying devices.',
  'Defining what a computer network is, with simple analogies.',
  'Distinguishing between the public Internet and private networks (intranets).',
  'How data travels in small pieces (packets) and the role of unique identifiers (IP addresses).',
  'Introducing the concept of data packets and how information travels across a network.',
  'Introduction to computer networks, what they are, and why we use them daily.'
);

-- ── HOME NETWORKING ───────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Home Networking' WHERE topic IN (
  'Basic components of a home network: modem, router, and the concept of Wi-Fi.',
  'Comparing and contrasting Wi-Fi (wireless) and Ethernet (wired) connections, including their pros and cons.',
  'Explaining the basic components of a typical home network (router, modem, devices).'
);

-- ── NETWORK SECURITY ──────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Network Security' WHERE topic IN (
  'Analysis of stateful vs. stateless firewall packet filtering, explaining how rules are processed, and the impact on network security.',
  'Applying blockchain and DLTs to secure network configuration, identity management in decentralized networks, and immutable logging for auditing.',
  'Exploration of advanced NAC implementations beyond basic authentication, including policy-based access, post-connect visibility, IoT device onboarding, and automated threat response through network segmentation and quarantine mechanisms.',
  'Exploring post-quantum cryptographic primitives (e.g., lattice-based, multivariate) and their integration challenges into existing network security protocols (TLS, IPSec) to future-proof against quantum attacks.',
  'Exploring post-quantum cryptographic primitives (e.g., lattice-based, multivariate) for securing network communication channels against future quantum adversaries.'
);

-- ── SOFTWARE-DEFINED NETWORKING ───────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Software-Defined Networking' WHERE topic IN (
  'Deep dive into the architecture and operational models of SDN/NFV for large-scale service provider environments, focusing on orchestration frameworks, policy enforcement, VNF chaining, and programmable network landscapes.',
  'Delving into complex SDN controller architectures (e.g., ONOS, OpenDaylight), network function virtualization (NFV) service chaining, and intent-based networking.'
);

-- ── NETWORK ARCHITECTURE ──────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Network Architecture' WHERE topic IN (
  'Delving into complex VLAN Trunking Protocol (VTP) modes, Inter-VLAN routing techniques, and VLAN security best practices.',
  'Exploration of how VLANs segment networks at Layer 2, including 802.1Q tagging, native VLANs, and the purpose and operation of trunk links.',
  'How 802.1Q VLAN tagging works, the distinction between access and trunk ports, and the mechanics of multiple VLANs traversing a single physical link.',
  'Implementing fine-grained network segmentation in data centers using VXLAN overlays for scalability and EVPN for control plane integration across multi-vendor environments.'
);

-- ── 5G NETWORKS ───────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = '5G Networks' WHERE topic IN (
  'Deep dive into 5G network slicing architectures, including resource isolation techniques, slice management functions (SMF), and orchestration for diverse service level agreements (SLAs) with dynamic QoS.',
  'Examining IEEE 802.1Q TSN standards for deterministic communication in industrial control systems, critical infrastructure, and edge computing environments, including convergence with 5G.'
);

-- ── TCP/IP ────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'TCP/IP' WHERE topic IN (
  'Examining various TCP congestion control algorithms (e.g., Reno, NewReno, CUBIC, BBR), their mechanisms for adjusting window sizes, and their impact on network throughput and fairness.',
  'Explanation of TCP''s three-way handshake, sliding window mechanism, and congestion control algorithms like slow start and AIMD.',
  'Exploring the AIMD principles of TCP congestion control (slow start, congestion avoidance, fast retransmit, fast recovery) and their impact on network performance.'
);

-- ── OSPF ──────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'OSPF' WHERE topic IN (
  'Detailed breakdown of how OSPF (Open Shortest Path First) calculates routes using Dijkstra''s algorithm, builds LSAs, and maintains its link-state database.',
  'Explaining OSPF''s neighbor discovery, LSA types, SPF algorithm, and area concepts for efficient routing table generation.',
  'Explaining the different types of Link-State Advertisements (LSAs) in OSPF, their purpose, and how they contribute to routing table construction and network convergence.'
);

-- ── NAT ───────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'NAT' WHERE topic IN (
  'Detailed explanation of Static NAT, Dynamic NAT, Port Address Translation (PAT) including port overloading and connection tracking mechanisms.',
  'Explaining Port Address Translation (PAT)/Network Address Port Translation (NAPT), its operational differences from basic NAT, and how it enables multiple devices to share a single public IP address.',
  'In-depth look at Port Address Translation (PAT) and Carrier-Grade NAT (CGN), explaining their necessity, operational mechanics, and implications for network design.'
);

-- ── DHCP ──────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'DHCP' WHERE topic IN (
  'Explaining the DORA process in detail, DHCP relay agents, and common DHCP options for IP address management and network configuration.'
);

-- ── QUALITY OF SERVICE ────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Quality of Service' WHERE topic IN (
  'Detailed examination of sophisticated Quality of Service (QoS) mechanisms like hierarchical token bucket (HTB) shapers/policers and Explicit Congestion Notification (ECN) in diverse network scenarios to ensure deterministic performance for ultra-low latency applications.'
);

-- ── GRAPH THEORY ─────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Graph Theory' WHERE topic IN (
  'Ağ akışlarının formülasyonu, Ford-Fulkerson algoritmasının detaylı analizi, Edmonds-Karp geliştirilmesi ve maksimum akış-minimum kesit teoreminin gerçek dünya lojistik ve veri transferi optimizasyonlarındaki derinlemesine uygulamaları.',
  'Graf teorisi algoritmalarını (Dijkstra, Kruskal, Prim) problem çözümünde uygulama',
  'Grafik nedir (düğüm ve kenar), yönlü ve yönsüz grafikler, komşuluk gibi temel grafik terminolojisi ve basit bir örnek.'
);

-- ── ECONOMICS ─────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Economics' WHERE topic IN (
  'Basic definition of an economy and its purpose',
  'Definition of market economy and its core features',
  'Definition of market, buyers, sellers, and transactions.',
  'Defining goods and services with simple examples',
  'Defining households, firms, and governments as economic actors',
  'Defining markets and their basic components: buyers, sellers, goods/services.',
  'Differentiating between private, public, club, and common pool goods',
  'Differentiating between tangible goods and intangible services.',
  'Distinguishing between tangible products (goods) and intangible actions (services) in economic markets.',
  'Explaining price as a signal of value and scarcity in an economy.',
  'Explanation of what a market is and its role in exchange',
  'Exploring money''s functions as a medium of exchange, unit of account, and store of value.',
  'How prices are set and their function in a market economy.',
  'Introduction to different types of economies (e.g., market, command) and their characteristics.',
  'Introduction to externalities, public goods, and information asymmetry.',
  'Measuring the benefits of market transactions for buyers and sellers',
  'Overview of common market types: local, national, global.',
  'Overview of different economic models: command, market, and mixed economies.'
);

-- ── MARKET STRUCTURES ─────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Market Structures' WHERE topic IN (
  'Analysis of perfect competition, monopolistic competition, oligopoly, and monopoly',
  'Analyzing different market structures like perfect competition, monopoly, and oligopoly.',
  'Comparing perfect competition, monopoly, oligopoly, and monopolistic competition.'
);

-- ── SUPPLY & DEMAND ───────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Supply & Demand' WHERE topic IN (
  'Core definitions of supply, demand, and how they interact to set prices.',
  'Defining supply, demand, and how they interact to determine prices.',
  'Detailed explanation of equilibrium price and quantity, and what happens when markets are out of balance.',
  'Explaining what supply and demand are and their individual roles.',
  'How responsive quantity demanded or supplied is to a change in price.',
  'How sensitive supply and demand are to price changes and its implications.',
  'How shifts in supply and demand curves affect equilibrium price and quantity.',
  'Introduction to demand and supply and how they affect prices'
);

-- ── INFLATION ─────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Inflation' WHERE topic IN (
  'Basic definition of inflation, its causes, and basic impacts.',
  'Enflasyon ve deflasyonun nedenleri, ölçülmesi, faiz oranları, yatırım kararları ve tüketici davranışları üzerindeki somut etkileri.',
  'Enflasyonun tanımı (fiyat artışı), nedenleri ve satın alma gücüne etkisinin basitçe açıklanması.',
  'Explainig what is inflation and what causes it',
  'Introduction to Inflation'
);

-- ── MONETARY POLICY ───────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Monetary Policy' WHERE topic IN (
  'Analyzing the ripple effects of central bank interest rate increases on bonds, stocks, real estate, and consumer borrowing.',
  'Beyond interest rates: how quantitative easing/tightening, reserve requirements, and forward guidance influence money supply, credit availability, and economic activity.',
  'Exploring the theoretical underpinning and practical implementation of NIRP by central banks, its effects on bank profitability, credit channels, and sovereign debt markets.',
  'How central banks manage the money supply and interest rates to influence the economy.',
  'In-depth examination of quantitative easing (QE) methodologies, its transmission mechanisms into the real economy, and the second-order effects on inflation, asset prices, and currency valuations.',
  'In-depth look at unconventional monetary policy tools and their effects.',
  'Merkez bankalarının faiz oranları, niceliksel gevşeme/sıkılaştırma gibi araçları nasıl kullandığı ve bu politikaların bankacılık sistemine ve genel finansal piyasalara etkileri.',
  'Merkez bankası politikaları, enflasyon beklentileri ve jeopolitik riskler gibi makroekonomik faktörlerin faiz, kur ve MTA türevlerinin fiyatlamasına ve oynaklığına etkisi.'
);

-- ── FISCAL POLICY ─────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Fiscal Policy' WHERE topic IN (
  'Exploring common forms of government intervention like taxes, subsidies, price ceilings, and floors.',
  'Exploring price ceilings, price floors, taxes, and subsidies',
  'Government interventions like taxes, subsidies, and regulations.',
  'How governments use spending and taxation to influence economic conditions.'
);

-- ── GAME THEORY ───────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Game Theory' WHERE topic IN (
  'Analyzing positive feedback loops, lock-in, and strategies in two-sided markets.',
  'Applying game theory concepts (e.g., Nash Equilibrium) to competitive market scenarios.',
  'Applying game theory concepts like Nash Equilibrium to understand strategic interactions in markets.',
  'Applying Nash equilibrium and prisoner''s dilemma to firm behavior',
  'Applying prisoner''s dilemma and other game theory concepts to firm decision-making.'
);

-- ── BEHAVIORAL ECONOMICS ──────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Behavioral Economics' WHERE topic IN (
  'Analyzing moral hazard and adverse selection in markets and their economic consequences.',
  'How cognitive biases and heuristics influence market decisions and consumer behavior, and how these insights are used in policy and marketing.',
  'How psychological biases influence market behavior and lead to inefficiencies.',
  'How psychological factors influence consumer and investor decisions',
  'How psychological factors influence economic decision-making and market outcomes.',
  'Impact of unequal information on market outcomes and their economic consequences',
  'Impact of unequal information on market outcomes and solutions',
  'Integrating psychological biases and heuristics into traditional economic models of market behavior.'
);

-- ── INTERNATIONAL TRADE ───────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'International Trade' WHERE topic IN (
  'Explanation of exports, imports, trade surpluses, and deficits and their implications.'
);

-- ── INTEREST RATES ────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Interest Rates' WHERE topic IN (
  'A simple explanation of what an interest rate is, how it works when you borrow or lend money, and its basic impact.'
);

-- ── PERSONAL FINANCE ──────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Personal Finance' WHERE topic IN (
  'Basic Credit Card Functionality and Debt',
  'Basic Personal Budgeting',
  'Basic Savings (Emergency Fund)',
  'Banka nedir, temel bankacılık hizmetleri (hesap açma, para yatırma/çekme) ve işlevleri',
  'Birikim hesabının tanımı, nasıl açılacağı, paranın nasıl değerlendirildiği ve faiz kavramının basit açıklaması.',
  'Defining debt as borrowed money that must be repaid, and introducing the concept of interest.',
  'Defining income (money coming in) and expenses (money going out), and understanding the fundamental difference between them.',
  'Defining saving and investing, and explaining their fundamental differences and purposes.',
  'Distinguishing between saving (setting money aside) and investing (putting money to work for potential growth), and their most basic goals.',
  'Explaining different types of debt (e.g., loans, credit cards) and the concept of interest.',
  'Explaining what a budget is (a plan for your money), its purpose, and why creating a simple one is important.',
  'Gelir ve gider kavramlarının açıklaması, kaynakları ve kişisel bütçe yapmanın önemi.',
  'Gelir ve gider kavramlarının tanımı ve bunların kişisel finans üzerindeki etkisi',
  'Kişisel bütçelemenin tanımı, önemi ve nasıl yapılacağı',
  'Kredi kartının işleyişi, kullanım amaçları, limit ve asgari ödeme gibi temel terimler.',
  'Net vs. Gross Income (Deductions)',
  'Nuance of predatory lending practices and how seemingly attractive debt offers can lead to financial ruin, even for responsible borrowers.'
);

-- ── INVESTING ─────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Investing' WHERE topic IN (
  'Counterintuitive idea that market downturns, while scary, present prime buying opportunities due to lower prices and long-term recovery.',
  'Discussing advanced asset allocation strategies, including rebalancing techniques and the interplay between different asset classes for optimizing portfolio returns and managing risk.',
  'Explaining how combining different types of assets (stocks, bonds, real estate) reduces overall investment risk and smooths out returns over time.',
  'Explaining how money can grow over time through compound interest and its long-term benefits.',
  'Exploring common tax-advantaged accounts and strategies to minimize capital gains and income tax liabilities',
  'Farklı varlık sınıfları arasındaki korelasyonlar ve bunları kullanarak portföy riskini minimize etme stratejileri.',
  'How various taxes (sales tax, property tax, excise tax, etc.) constantly erode purchasing power and wealth beyond income tax, often overlooked.',
  'Leveraging tax deferral and tax-advantaged accounts beyond the basics',
  'Opportunity cost of delaying investment decisions, focusing on the unseen losses of not putting capital to work early.'
);

-- ── FIXED INCOME ──────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Fixed Income' WHERE topic IN (
  'Advanced analysis of yield curve shapes, particularly inversions, as a leading indicator for economic recessions and market sentiment, including different segments and their predictive power.',
  'Constructing bond portfolios to manage interest rate fluctuations',
  'Kupon ödemeleri, vade, faiz oranları ve tahvil fiyatları arasındaki ilişkinin matematiksel temelleri ve getiri eğrisinin ekonomik sinyalleri nasıl yorumladığı.'
);

-- ── BEHAVIORAL FINANCE ────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Behavioral Finance' WHERE topic IN (
  'Advanced examination of behavioral biases impacting market efficiency, delving into market microstructure concepts like adverse selection, order book dynamics, and the practical limits of arbitrage for professional traders.',
  'An advanced look at how cognitive biases (e.g., hindsight bias, overconfidence, availability heuristic) systemically impact investment decisions and lead to suboptimal portfolio construction and trading strategies.',
  'Investigating how cognitive biases and herd mentalities, traditionally applied to human traders, manifest and are exacerbated or mitigated in automated trading algorithms, particularly in flash crashes and market bubbles.'
);

-- ── MARKET EFFICIENCY ─────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Market Efficiency' WHERE topic IN (
  'Debating whether markets fully reflect all available information and why they sometimes don''t',
  'Examining the strengths and weaknesses of EMH and alternative theories.',
  'Examining the theory of efficient markets and documented market anomalies.',
  'Exploring the different forms of the Efficient Market Hypothesis and its implications for investment strategies and market predictability.',
  'Exploring the weak, semi-strong, and strong forms of market efficiency, and the implications for active vs. passive investing strategies and information arbitrage.'
);

-- ── MARKET MICROSTRUCTURE ─────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Market Microstructure' WHERE topic IN (
  'An in-depth look at order book dynamics, specific HFT strategies like quote stuffing and flickering, and their impact on market efficiency, price discovery, and regulatory challenges.',
  'Detailed analysis of identifying and exploiting ephemeral arbitrage opportunities across different financial markets (e.g., statistical arbitrage, convertible bond arbitrage, options calendars) by leveraging market inefficiencies and advanced algorithmic strategies.',
  'Piyasa mikro yapısı teorileri, emir defteri dinamikleri, pazar yapıcı (market making) stratejilerinin algoritmik tasarımı ve latency arbitrajının finansal mühendislik bakış açısıyla incelenmesi.'
);

-- ── SYSTEMIC RISK ─────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Systemic Risk' WHERE topic IN (
  'Analyzing financial interconnectedness using graph theory and network models to quantify systemic risk, identify critical nodes, and predict contagion pathways during financial crises, including regulatory implications.',
  'Analyzing the mechanisms by which market illiquidity can amplify financial shocks, leading to cascading failures across interconnected institutions and the role of fire sales.',
  'Exploring quantitative models and network theory approaches to analyze and mitigate systemic risk within interconnected financial systems, including contagion mechanisms and stress testing methodologies.'
);

-- ── DERIVATIVES ───────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Derivatives' WHERE topic IN (
  'Applying Ito''s Lemma and stochastic calculus to derive and understand advanced option pricing models beyond Black-Scholes, including jump-diffusion and local volatility models.',
  'Applying Ito''s Lemma and stochastic differential equations to derive and understand advanced option pricing models like Black-Scholes-Merton under varying volatility regimes, including implications of jump diffusion.',
  'Delta, Gama, Vega, Teta gibi Yunan harflerinin opsiyon fiyatlaması ve risk yönetimi üzerindeki etkileri ile farklı volatilite arbitrajı stratejileri.',
  'Delving into Heston and SABR models for accurately pricing derivatives under non-constant volatility conditions, including parameter calibration challenges and smile/smirk effects.',
  'Explaining the mechanics of call and put options, common strategies like covered calls and protective puts, and their role in hedging and speculation.',
  'Exploration of sophisticated models for pricing complex derivatives (e.g., exotic options, credit default swaps) using stochastic calculus, Ito''s Lemma, and the risk-neutral valuation framework.',
  'Heston ve SABR gibi gelişmiş stokastik volatilite modellerinin türev fiyatlandırmasındaki uygulamaları, kalibrasyon teknikleri ve piyasa verileriyle uyumlandırma zorlukları.',
  'Introduction to sophisticated models used for valuing financial options.',
  'Mechanics and strategic uses of basic stock options for hedging and speculation',
  'Mechanics of options contracts for hedging and speculation',
  'Opsiyon sözleşmelerinin (alım/satım opsiyonları) nasıl çalıştığı, farklı stratejiler (koruyucu alım, kapalı satım) ve portföy riskini azaltmada nasıl kullanılabileceği.',
  'Opsiyon sözleşmelerinin temel değerleme parametreleri olan Delta ve Gama''nın zaman ve fiyat değişimleriyle nasıl etkileşimde bulunduğunu ve türev piyasalarında nasıl kar/zarar profili yarattığını analiz etmek.'
);

-- ── STRUCTURED FINANCE ────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Structured Finance' WHERE topic IN (
  'Deconstructing the complexities of synthetic Collateralized Debt Obligations (CDOs), including bespoke tranched structures, basis risk, correlation dynamics, and their role in credit default swap (CDS) markets.',
  'Farklı yapılandırılmış ürün türlerinden olan sertifikaların (örneğin, endeks sertifikaları, garanti fon sertifikaları) bileşenlerini, risk-getiri profillerini ve yatırımcılar için nasıl oluşturulduğunu anlatmak.',
  'Kompleks türev ürünlerin (kapalı uçlu fonlar, sertifikalar) yapısı, fiyatlandırma mekanizmaları ve yatırımcılar için avantaj/dezavantajları.'
);

-- ── CREDIT RISK ───────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Credit Risk' WHERE topic IN (
  'Credit Default Swap (CDS) sözleşmelerinin çalışma prensibini, kredibilitenin ölçümünde ve kredi riskinin transferinde nasıl kullanıldığını ve fiyatlamasını etkileyen faktörleri açıklamak.',
  'In-depth analysis of Counterparty Credit Risk (CCR), explaining the calculation and implications of Credit Valuation Adjustment (CVA), Debit Valuation Adjustment (DVA), and Funding Valuation Adjustment (FVA) in derivative pricing and hedging.',
  'Kredi temerrüt takası (CDS) ve diğer kredi türevlerinin ileri seviye fiyatlandırma metodolojileri; karşı taraf riskinin (CVA) ve kendi kredi riskinin (DVA) türev değerlemesine etkisi.',
  'Kredi Varsayılan Takaslarının (Credit Default Swaps - CDS) detaylı yapısı, fiyatlama modelleri, kontrparty riskleri ve kullanım alanları.'
);

-- ── RISK MANAGEMENT ───────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Risk Management' WHERE topic IN (
  'Değer riski (VaR) ve Beklenen Eksiklik (ES) gibi risk ölçütlerinin ötesinde, kuyruk riskinin tespiti, modellenmesi ve aşırı olaylar için koherent risk ölçütlerinin (örneğin Spektral Risk Ölçütleri) uygulamaları.',
  'Model riskinin (model uncertainty) belirlenmesi, ölçülmesi ve yönetimi. Farklı modellerin çıktılarını birleştirme (model averaging) ve model yanlılığı (model bias) düzeltme teknikleri.'
);

-- ── VALUATION ─────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Valuation' WHERE topic IN (
  'Bir şirketin veya projenin bugünkü değerini, gelecekteki nakit akışlarını belirli bir iskonto oranıyla indirgeyerek nasıl hesaplayacağının pratikteki adımları ve varsayımları.',
  'Bir varlığın adil değerini belirlemenin temel mantığı ve bu modellerin neden kullanıldığına dair basit bir giriş.',
  'İndirgenmiş Nakit Akışları (DCF), Karşılaştırılabilir Şirket Analizi (Comparable Company Analysis) gibi ileri düzey değerleme metotlarının uygulama adımları ve varsayımları.',
  'Introduction to valuing an asset or business using future cash flows',
  'Paranın zaman içindeki değeri kavramı ve gelecekteki nakit akışlarının bugünkü değerine nasıl dönüştürüldüğü.'
);

-- ── STOCK MARKET ──────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Stock Market' WHERE topic IN (
  'borsaya giriş ilk öğrenciler için',
  'Enflasyon, işsizlik, GSYİH gibi temel makroekonomik göstergelerin hisse senedi, tahvil ve döviz piyasaları üzerindeki doğrudan ve dolaylı etkilerinin analizi.',
  'Explaining commodities market and the products there',
  'Gayri Safi Yurt İçi Hasıla (GSYİH), işsizlik oranları, merkez bankası faiz kararları gibi makroekonomik göstergelerin hisse senedi, tahvil ve döviz piyasalarındaki volatilite ve trendler üzerindeki etkileşimi.',
  'Hisse senedi, tahvil gibi temel finansal araçlar ve bu araçların işlem gördüğü piyasaların tanıtımı.'
);

-- ── QUANTITATIVE FINANCE ──────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Quantitative Finance' WHERE topic IN (
  'Finansal enstrümanların fiyatlandırılması, risk yönetimi ve portföy optimizasyonunda Monte Carlo yöntemlerinin derinlemesine uygulamaları.',
  'Finansal modellerde belirsizliği ve kompleksliği ele almak için Monte Carlo simülasyonunun nasıl kullanıldığını, özellikle varlık fiyatlarının ve türev araçların değerlemesinde uygulamasını göstermek.',
  'Finansal piyasalarda kullanılan nicel modeller, algoritmik ticaret stratejileri (örneğin, yüksek frekanslı ticaret, arbitraj) ve backtesting metodolojileri.',
  'Finans mühendisliğinin tanımı, ne işe yaradığı ve neden önemli olduğu gibi temel kavramlar.'
);

-- ── FOREIGN EXCHANGE ──────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Foreign Exchange' WHERE topic IN (
  'Exploring the factors that drive foreign exchange market fluctuations, including economic indicators, geopolitical events, and central bank policies.',
  'Farklı türdeki faiz swaplarının (faize karşı faiz, ana paraya karşı faiz vb.) yapısını, kullanım amaçlarını (riskten korunma, spekülasyon) ve piyasa değerleme mekanizmalarını incelemek.'
);

-- ── ISLAMIC FINANCE ───────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Islamic Finance' WHERE topic IN (
  'Faizsiz finans prensipleri, Murabaha, Mudaraba, Müşaraka gibi İslami finansal enstrümanlar ve Sukuk ihraçlarının karmaşık yapıları.'
);

-- ── CRYPTOCURRENCY ────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Cryptocurrency' WHERE topic IN (
  'Kripto paralar ve volatilite sebepleri.'
);

-- ── QUANTUM COMPUTING ─────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Quantum Computing' WHERE topic IN (
  'Discussion of emerging applications of quantum computing for complex financial problems, such as portfolio optimization, high-frequency trading, and post-quantum cryptography in blockchain and secure transactions.',
  'Examining the potential applications of quantum annealing and gate-based quantum computers for portfolio optimization, risk management, and Monte Carlo simulations in finance, along with current limitations.',
  'Exploring the theoretical frameworks and nascent practical applications of quantum machine learning and quantum annealing for high-frequency trading strategies, specifically focusing on quantum-enhanced arbitrage detection and execution.'
);

-- ── MONEY ─────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Money' WHERE topic IN (
  'Para birimlerinin tanımı, işlevleri ve enflasyonun temel açıklaması',
  'Paranın tanımı, işlevleri (değişim aracı, değer saklama, hesap birimi) ve günlük hayattaki rolü.'
);

-- ── ARTIFICIAL INTELLIGENCE ───────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Artificial Intelligence' WHERE topic IN (
  'Briefly introducing different types of AI through very basic, relatable examples like chatbots or image recognition.',
  'Defining Artificial Intelligence and its core purpose: making machines think like humans.',
  'Explaining the practical impact of AI on everyday life, from smartphone assistants to online shopping.',
  'Introducing Machine Learning as a key way AI learns without explicit programming, using examples like recommendation systems.'
);

-- ── MACHINE LEARNING ──────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Machine Learning' WHERE topic IN (
  'Advanced methodologies for interpreting complex AI models (e.g., LIME, SHAP, attention mechanisms), focusing on regulatory compliance, fairness auditing, and trust in critical applications.',
  'Deep dive into adversarial examples, white-box/black-box attacks against neural networks, and countermeasure strategies like adversarial training and certified robustness.',
  'Exploring advanced techniques for establishing causality in AI models, including DoWhy, instrumental variables, and counterfactual reasoning in decision-making.'
);

-- ── REINFORCEMENT LEARNING ────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Reinforcement Learning' WHERE topic IN (
  'Complex RL scenarios involving POMDPs, decentralized partially observable Markov decision processes (Dec-POMDPs), and coordination strategies in competitive and cooperative multi-agent environments.'
);

-- ── CHESS ─────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Chess' WHERE topic IN (
  'A simple, step-by-step guide on how to correctly set up the chessboard and all the pieces before starting a game.',
  'Basic checkmate patterns and how to achieve them (e.g., King and Rook vs. King).',
  'basic chess for kids',
  'Explaining how each chess piece moves and its unique abilities (e.g., rooks like tanks, bishops like snipers).',
  'Explaining pawn movement (one or two squares), capturing diagonally, and the special ''en passant'' rule.',
  'Explaining the King''s move, capture, and the critical rules and strategy behind the Castling maneuver to keep the King safe.',
  'Explaining the movement rules for rooks, bishops, and queens with simple, visual examples.',
  'Focusing on the unique movement of pawns (including first-move options) and the knight''s ''L-shaped'' jump with easy-to-understand animations.',
  'Her bir satranç taşının adı, nasıl hareket ettiği ve ne kadar değerli olduğu anlatılacak. Çocuklar için renkli animasyonlar ve hayvan benzetmeleri kullanılacak.',
  'how to start playing chess',
  'Introduction to all chess pieces, their names, and how each moves (rook, knight, bishop, queen, king, pawn).',
  'Introduction to all chess pieces: their names, how they look, and their basic starting positions on the board.',
  'Introducing the concept of ''check'' and ''checkmate'' and explaining how to capture the king to win the game.'
);

-- ── MATHEMATICS ───────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Mathematics' WHERE topic IN (
  'arithmetics',
  'Basic marhematics for kids',
  'basic mathematics for kids',
  'Mathematic'
);

-- ── DISCRETE MATHEMATICS ─────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Discrete Mathematics' WHERE topic IN (
  'Ayrık matematik teriminin tanımı, diğer matematik dallarından farkı ve günlük hayattaki önemi (örneğin bilgisayar bilimleri).',
  'Cesar şifrelemesi ve RSA gibi kriptografik algoritmalarda modüler aritmetik kullanımı',
  'Doğrusal ve homojen indirgeme bağıntılarının karakteristik denklem yöntemiyle çözümü',
  'İkili ilişki kavramı, tanım ve değer kümeleri, birebir ve örten gibi basit fonksiyon türlerine giriş.',
  'İkili ilişkilerde enine boyuna sayma problemlerinin çözümü için çift yönlü sayma (double counting) prensibinin ileri uygulamaları ve bu yöntemlerle ispatlanabilen karmaşık kombinatorik özdeşlikler.',
  'İlişkilerin özellikleri (yansımalı, simetrik, geçişli) ve denklik sınıfları',
  'Küme kavramı, elemanlar, boş küme, evrensel küme tanımı ve birleşim, kesişim, fark gibi basit küme işlemleri.',
  'Mantık devrelerinin basitleştirilmesi için Karno haritaları (K-Haritaları) teorisi ve uygulaması',
  'Önermeler, VE (AND), VEYA (OR), DEĞİL (NOT) gibi temel mantık kapıları ve basit doğruluk tabloları oluşturma.'
);

-- Batch-generated placeholder topics → Discrete Mathematics
UPDATE public.generated_video_jobs SET topic = 'Discrete Mathematics'
WHERE topic ~ '^Discrete Math (beginner|intermediate|advanced) concept [0-9]+$';

-- ── PHYSICS ───────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Physics' WHERE topic IN (
  'Cisimlerin hareket durumlarını koruma eğilimi olan eylemsizlik prensibinin basitçe açıklanması.',
  'Dairesel harekette merkezcil kuvvetin rolünü, merkezkaç kuvvetin fiziksel bir kuvvet olmadığını ve bu kuvvetlerin günlük yaşamdaki uygulamalarını inceleme.',
  'Dinamik sistemlerde başlangıç koşullarına aşırı duyarlılık, kelebek etkisi ve hareketin uzun vadeli öngörülemezliği gibi kavramların matematiksel modellemesi.',
  'Hamiltoncu sistemlerin faz uzayındaki zaman evrimi, Liouville teoremi ve mekanik sistemlerin korunmuş özelliklerinin geometrik yorumları.',
  'Hareket denklemlerinin türetilmesinde varyasyonel prensiplerin (en küçük etki prensibi) kullanımı ve bunların klasik mekanikten kuantum mekaniğine uzanan uygulamaları.',
  'Hareket, durgunluk, konum ve yer değiştirme kavramlarının en basit açıklamaları.',
  'Hızın yönlü bir büyüklük, süratin ise yönü olmayan bir büyüklük olduğunun temel farkı.',
  'İtme-momentum teoremini ve çarpışmalardaki momentum korunumu ilkesini detaylandırarak, farklı çarpışma türlerinde momentumun nasıl korunduğunu gösterme.',
  'İvme kavramının günlük hayattan örneklerle tanıtılması ve hızlanma ile yavaşlamanın anlamı.',
  'Kuantum alan teorisinde sanal parçacıkların oluşumu, yok oluşu ve bunların gerçek parçacıklar arasındaki etkileşimlere enerji ve momentum transferi yoluyla katkısı.',
  'Kütleçekimsel potansiyel enerjinin bir cismin konumuyla nasıl değiştiğini ve bu değişimin yerçekimi kuvveti tarafından yapılan iş ile ilişkisini açıklama.',
  'Kuvvetin itme veya çekme olarak tanımı ve cisimlerin hareketini nasıl değiştirdiği.',
  'Özel görelilik teorisindeki Lorentz dönüşümleri, göreli hızların bileşimi ve uzay-zaman sürekliliğinin hareket üzerindeki etkisi.'
);

-- ── CODING ────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Coding' WHERE topic = 'Coding for kids';

-- ── COLORS ────────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Colors' WHERE topic IN (
  'Colors for kids',
  'Introduction to primary and secondary colors, and how to use them to create vibrant and expressive drawings.'
);

-- ── DRAWING ───────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Drawing' WHERE topic IN (
  'How to break down complex animal shapes into simple circles, squares, and triangles to make drawing easier.'
);

-- ── WEATHER ───────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Weather' WHERE topic = 'how weather works';

-- ── ARDUINO ───────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Arduino' WHERE topic = 'arduino nedir';

-- ── BASKETBALL ────────────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'Basketball' WHERE topic = 'basketbol';

-- ── HOW ENGINES WORK ──────────────────────────────────────────────────────────
UPDATE public.generated_video_jobs SET topic = 'How Engines Work' WHERE topic IN (
  'How an engine work in basics',
  'How engines work'
);

-- ── BATCH PLACEHOLDER TOPICS ─────────────────────────────────────────────────
-- "Economic Concepts beginner/intermediate/advanced concept N" → Economics
UPDATE public.generated_video_jobs SET topic = 'Economics'
WHERE topic ~ '^Economic Concepts (beginner|intermediate|advanced) concept [0-9]+$';

-- "Mathematic beginner concept N" → Mathematics
UPDATE public.generated_video_jobs SET topic = 'Mathematics'
WHERE topic ~ '^Mathematic (beginner|intermediate|advanced) concept [0-9]+$';

-- "Finance beginner concept N" → Finance
UPDATE public.generated_video_jobs SET topic = 'Finance'
WHERE topic ~ '^Finance (beginner|intermediate|advanced) concept [0-9]+$';

-- ── MINOR FIXES ───────────────────────────────────────────────────────────────
-- Normalize "Mathematic" → "Mathematics" (standalone)
UPDATE public.generated_video_jobs SET topic = 'Mathematics' WHERE topic = 'Mathematic';

-- ── CASCADE TO generated_videos ───────────────────────────────────────────────
UPDATE public.generated_videos gv
SET    topic = j.topic,
       updated_at = now()
FROM   public.generated_video_jobs j
WHERE  gv.job_id = j.id
  AND  gv.topic IS DISTINCT FROM j.topic;

-- ── CASCADE TO kids_content.topic ─────────────────────────────────────────────
UPDATE public.kids_content kc
SET    topic = gv.topic,
       updated_at = now()
FROM   public.generated_videos gv
WHERE  kc.source_generated_video_id = gv.id
  AND  kc.topic IS DISTINCT FROM gv.topic;

-- ── CASCADE TO videos.topic ───────────────────────────────────────────────────
UPDATE public.videos v
SET    topic = gv.topic
FROM   public.generated_videos gv
WHERE  v.source_generated_video_id = gv.id
  AND  v.topic IS DISTINCT FROM gv.topic;

COMMIT;
