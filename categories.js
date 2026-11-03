const CATEGORIES = [
  {
    id: 'ai',
    label: 'AI',
    domainWeight: 7,
    keywordWeight: 7,
    domains: [
      'openai.com', 'chatgpt.com', 'anthropic.com', 'claude.ai',
      'gemini.google.com', 'aistudio.google.com', 'notebooklm.google.com',
      'perplexity.ai', 'huggingface.co', 'midjourney.com', 'stability.ai',
      'replicate.com', 'together.ai', 'groq.com', 'ollama.com', 'lmstudio.ai',
      'copilot.microsoft.com', 'cursor.com', 'codeium.com', 'runwayml.com',
      'deepmind.com', 'x.ai', 'mistral.ai', 'cohere.com', 'poe.com',
      'character.ai', 'civitai.com', 'suno.com', 'elevenlabs.io',
      'deepseek.com', 'meta.ai', 'sora.com', 'firefly.adobe.com',
      'labs.google', 'you.com', 'phind.com', 'leonardo.ai', 'ideogram.ai',
      'krea.ai', 'lumalabs.ai', 'heygen.com', 'synthesia.io', 'otter.ai',
      'gamma.app', 'grok.com', 'deepai.org',
    ],
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning',
      'neural network', 'neural networks', 'large language model',
      'large language models', 'llm', 'llms', 'gpt', 'chatgpt', 'openai',
      'anthropic', 'claude', 'gemini', 'copilot', 'midjourney',
      'stable diffusion', 'generative ai', 'gen ai', 'prompt engineering',
      'hugging face', 'huggingface', 'deepseek', 'mistral', 'llama',
      'transformer', 'transformers', 'diffusion model',
      'retrieval augmented generation', 'fine-tuning', 'fine tuning',
      'embeddings', 'vector database', 'text-to-image', 'text to image',
      'text to video', 'speech to text', 'computer vision',
      'natural language processing', 'nlp', 'ai agent', 'ai agents',
      'agentic', 'multimodal', 'foundation model', 'sora',
      'elevenlabs', 'character ai', 'perplexity ai',
    ],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    domainWeight: 10,
    keywordWeight: 5,
    domains: [
      'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it',
      'amazon.es', 'amazon.ca', 'amazon.com.au', 'amazon.co.jp', 'amazon.in',
      'amazon.com.br', 'amazon.com.mx', 'amazon.nl', 'amazon.se',
      'amazon.pl', 'amazon.sg', 'amazon.ae', 'amazon.sa', 'amazon.com.tr',
      'ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it', 'ebay.es',
      'etsy.com', 'walmart.com', 'target.com', 'bestbuy.com', 'costco.com',
      'homedepot.com', 'lowes.com', 'ikea.com', 'aliexpress.com',
      'alibaba.com', 'temu.com', 'shein.com', 'zalando.com', 'zalando.de',
      'zalando.co.uk', 'asos.com', 'nordstrom.com', 'macys.com',
      'wayfair.com', 'wayfair.co.uk', 'chewy.com', 'flipkart.com',
      'mercadolibre.com', 'mercadolibre.com.mx', 'mercadolibre.com.ar',
      'mercadolibre.com.br', 'mercadolibre.cl', 'mercadolibre.co',
      'allegro.pl', 'bol.com', 'otto.de', 'idealo.de', 'idealo.co.uk',
      'idealo.fr', 'idealo.it', 'idealo.es', 'shopify.com', 'craigslist.org',
      'gumtree.com', 'poshmark.com', 'depop.com', 'vinted.com',
      'vinted.co.uk', 'vinted.de', 'reverb.com', 'argos.co.uk',
      'johnlewis.com', 'currys.co.uk', 'mediamarkt.de', 'fnac.com',
      'elcorteingles.es', 'rakuten.co.jp', 'wayfair.de', 'wish.com',
    ],
    keywords: [
      'shopping', 'shop', 'cart', 'checkout', 'buy', 'purchase', 'order',
      'sale', 'deal', 'deals', 'discount', 'coupon', 'coupons', 'price',
      'prices', 'product', 'products', 'store', 'marketplace', 'wishlist',
      'delivery', 'shipping', 'returns', 'free shipping', 'add to cart',
      'in stock', 'out of stock', 'black friday', 'cyber monday',
      'prime day', 'best buy', 'deal of the day', 'clearance', 'bargain',
      'promo', 'promo code', 'voucher', 'retail', 'ecommerce', 'e-commerce',
    ],
  },
  {
    id: 'dev',
    label: 'Development',
    domainWeight: 7,
    keywordWeight: 5,
    domains: [
      'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
      'stackexchange.com', 'superuser.com', 'serverfault.com', 'npmjs.com',
      'pypi.org', 'crates.io', 'packagist.org', 'rubygems.org', 'nuget.org',
      'developer.mozilla.org', 'devdocs.io', 'docs.python.org', 'docs.rs',
      'go.dev', 'golang.org', 'rust-lang.org', 'nodejs.org', 'react.dev',
      'nextjs.org', 'vuejs.org', 'svelte.dev', 'angular.io',
      'typescriptlang.org', 'tailwindcss.com', 'webpack.js.org',
      'vitejs.dev', 'docker.com', 'kubernetes.io', 'helm.sh',
      'terraform.io', 'ansible.com', 'cloudflare.com', 'vercel.com',
      'vercel.app', 'netlify.com', 'render.com', 'railway.app', 'fly.io',
      'supabase.com',
      'firebase.google.com', 'aws.amazon.com', 'console.cloud.google.com',
      'portal.azure.com', 'codesandbox.io', 'stackblitz.com', 'replit.com',
      'jsfiddle.net', 'codepen.io', 'regex101.com', 'regexr.com',
      'jsonformatter.org', 'postman.com', 'insomnia.rest', 'swagger.io',
      'rapidapi.com', 'unpkg.com', 'cdn.jsdelivr.net', 'sourcegraph.com',
      'grep.app', 'explainshell.com', 'man7.org', 'tldr.sh', 'dev.to',
      'hashnode.com', 'freecodecamp.org', 'leetcode.com', 'hackerrank.com',
      'exercism.org', 'codewars.com', 'readthedocs.io', 'gitbook.com',
      'n8n.io', 'jetbrains.com', 'code.visualstudio.com', 'sentry.io',
      'grafana.com', 'localhost', '127.0.0.1',
    ],
    keywords: [
      'github', 'gitlab', 'repository', 'repositories', 'repo', 'commit',
      'commits', 'pull request', 'merge request', 'branch', 'branches',
      'stack overflow', 'stackoverflow', 'npm', 'pypi', 'package',
      'packages', 'dependency', 'dependencies', 'api', 'apis', 'sdk',
      'documentation', 'docs', 'tutorial', 'tutorials', 'programming',
      'javascript', 'typescript', 'python', 'rust', 'golang', 'react',
      'vue', 'svelte', 'angular', 'docker', 'kubernetes', 'terraform',
      'deploy', 'deployment', 'server', 'servers', 'database', 'databases',
      'sql', 'graphql', 'regex', 'json', 'git', 'linux', 'bash', 'terminal',
      'debug', 'debugging', 'stack trace', 'unit test', 'integration test',
      'open source', 'source code', 'changelog', 'release notes', 'security',
      'vulnerability', 'encryption', 'authentication', 'oauth', 'cors',
      'dns', 'websocket', 'cloud', 'aws', 'azure', 'gcp', 'serverless',
      'container', 'containers', 'framework', 'library', 'compiler',
      'runtime', 'kernel', 'operating system', 'command line', 'cli',
      'ide', 'vscode', 'jetbrains', 'neovim', 'vim', 'emacs',
    ],
  },
  {
    id: 'work',
    label: 'Work',
    domainWeight: 7,
    keywordWeight: 5,
    domains: [
      'docs.google.com', 'drive.google.com', 'sheets.google.com',
      'slides.google.com', 'calendar.google.com', 'mail.google.com',
      'meet.google.com', 'chat.google.com', 'keep.google.com',
      'notion.so', 'notion.site', 'slack.com', 'app.slack.com',
      'linear.app', 'asana.com', 'app.asana.com', 'trello.com',
      'monday.com', 'atlassian.com', 'atlassian.net', 'clickup.com',
      'airtable.com', 'coda.io', 'miro.com', 'figma.com', 'canva.com',
      'zoom.us', 'teams.microsoft.com', 'outlook.office.com',
      'outlook.live.com', 'office.com', 'microsoft365.com',
      'sharepoint.com', 'onedrive.live.com', 'dropbox.com', 'todoist.com',
      'ticktick.com', 'evernote.com', 'obsidian.md', 'roamresearch.com',
      'logseq.com', 'calendly.com', 'loom.com', 'grammarly.com',
      'deepl.com', 'translate.google.com', 'salesforce.com', 'hubspot.com',
      'zendesk.com', 'intercom.com', 'freshdesk.com', 'overleaf.com',
      'lucidchart.com', 'whimsical.com', 'excalidraw.com', 'tldraw.com',
      'diagrams.net', 'app.diagrams.net', 'typeform.com', 'jotform.com',
      'surveymonkey.com', 'mailchimp.com', 'buffer.com', 'hootsuite.com',
      'later.com', 'zapier.com', 'make.com', 'ifttt.com',
    ],
    keywords: [
      'docs', 'drive', 'sheets', 'slides', 'calendar', 'gmail', 'outlook',
      'slack', 'notion', 'jira', 'confluence', 'trello', 'asana',
      'clickup', 'airtable', 'figma', 'miro', 'zoom', 'google meet',
      'microsoft teams', 'sharepoint', 'onedrive', 'dropbox', 'todoist',
      'ticktick', 'evernote', 'obsidian', 'loom', 'calendly', 'crm',
      'salesforce', 'hubspot', 'zendesk', 'intercom', 'invoice',
      'meeting', 'agenda', 'project', 'task', 'sprint', 'backlog',
      'roadmap', 'wiki', 'knowledge base', 'memo', 'notes',
      'presentation', 'spreadsheet', 'document', 'timesheet', 'payroll',
      'onboarding', 'offboarding', 'okr', 'kpi',
    ],
  },
  {
    id: 'news',
    label: 'News & Reading',
    domainWeight: 4,
    keywordWeight: 2,
    domains: [
      'nytimes.com', 'washingtonpost.com', 'theguardian.com', 'bbc.com',
      'bbc.co.uk', 'reuters.com', 'apnews.com', 'cnn.com', 'foxnews.com',
      'nbcnews.com', 'cbsnews.com', 'abcnews.go.com', 'politico.com',
      'axios.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'economist.com',
      'techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com',
      'engadget.com', 'venturebeat.com', 'theinformation.com',
      'news.ycombinator.com', 'medium.com', 'substack.com',
      'nationalgeographic.com', 'sciencedaily.com',
      'nature.com', 'science.org', 'news.google.com', 'getpocket.com',
      'instapaper.com', 'readwise.io', 'goodreads.com',
    ],
    keywords: [
      'news', 'article', 'blog', 'story', 'report', 'breaking', 'headline',
      'editorial', 'opinion', 'analysis', 'interview', 'review',
      'press release', 'daily', 'weekly', 'times', 'journal', 'gazette',
      'tribune', 'herald', 'magazine', 'newspaper', 'column', 'feature',
    ],
  },
  {
    id: 'social',
    label: 'Social',
    domainWeight: 4,
    keywordWeight: 3,
    domains: [
      'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'reddit.com',
      'linkedin.com', 'tiktok.com', 'threads.net', 'mastodon.social',
      'mastodon.online', 'mastodon.world', 'fosstodon.org', 'hachyderm.io',
      'infosec.exchange', 'techhub.social', 'mstdn.social', 'mas.to',
      'bsky.app', 'discord.com', 'web.telegram.org', 'web.whatsapp.com',
      'messenger.com', 'snapchat.com', 'pinterest.com', 'tumblr.com',
      'nextdoor.com', 'meetup.com', 'quora.com',
    ],
    keywords: [
      'twitter', 'facebook', 'instagram', 'reddit', 'linkedin', 'tiktok',
      'threads', 'mastodon', 'bluesky', 'discord', 'telegram', 'whatsapp',
      'messenger', 'snapchat', 'pinterest', 'tumblr', 'quora', 'nextdoor',
      'meetup', 'social', 'tweet', 'status', 'profile', 'follower',
      'followers', 'following', 'friend', 'friends', 'community', 'forum',
      'subreddit', 'hashtag', 'meme', 'memes', 'viral', 'trending',
    ],
  },
  {
    id: 'media',
    label: 'Media',
    domainWeight: 4,
    keywordWeight: 4,
    domains: [
      'youtube.com', 'music.youtube.com', 'tv.youtube.com', 'netflix.com',
      'hulu.com', 'disneyplus.com', 'max.com', 'primevideo.com',
      'peacocktv.com', 'paramountplus.com', 'crunchyroll.com', 'plex.tv',
      'twitch.tv', 'kick.com', 'rumble.com', 'odysee.com', 'vimeo.com',
      'dailymotion.com', 'soundcloud.com', 'spotify.com', 'music.apple.com',
      'podcasts.apple.com', 'letterboxd.com', 'imdb.com',
      'rottentomatoes.com', 'last.fm', 'music.amazon.com', 'audible.com',
    ],
    keywords: [
      'youtube', 'netflix', 'hulu', 'disney', 'spotify', 'music',
      'podcast', 'podcasts', 'movie', 'movies', 'film', 'films', 'tv',
      'television', 'stream', 'streaming', 'twitch', 'vimeo',
      'soundcloud', 'album', 'playlist', 'trailer', 'episode', 'season',
      'series', 'anime', 'manga', 'comic', 'comics', 'game', 'games',
      'gaming', 'play', 'concert', 'live', 'radio', 'audiobook',
    ],
  },
  {
    id: 'games',
    label: 'Games',
    domainWeight: 10,
    keywordWeight: 0,
    domains: [
      'boardgamegeek.com', 'chess.com', 'lichess.org',
      'store.steampowered.com', 'steamcommunity.com', 'gog.com', 'itch.io',
      'epicgames.com', 'howlongtobeat.com', 'retroachievements.org',
      'minecraft.net', 'minecraft.wiki',
    ],
    keywords: [],
  },
  {
    id: 'finance',
    label: 'Finance',
    domainWeight: 10,
    keywordWeight: 5,
    domains: [
      'paypal.com', 'stripe.com', 'wise.com', 'revolut.com', 'monzo.com',
      'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
      'capitalone.com', 'hsbc.com', 'barclays.co.uk', 'lloydsbank.com',
      'natwest.com', 'santander.com', 'deutsche-bank.de', 'comdirect.de',
      'ing.de', 'bnp-paribas.com', 'coinbase.com', 'binance.com',
      'kraken.com', 'crypto.com', 'kucoin.com', 'okx.com', 'bybit.com',
      'robinhood.com', 'fidelity.com', 'schwab.com', 'vanguard.com',
      'etrade.com', 'tradingview.com', 'investing.com', 'marketwatch.com',
      'finance.yahoo.com', 'nerdwallet.com', 'mint.intuit.com',
      'quickbooks.intuit.com', 'xero.com', 'freshbooks.com', 'wave.com',
      'taxact.com', 'turbotax.com', 'irs.gov', 'hmrc.gov.uk',
      'pay.amazon.com', 'venmo.com', 'cash.app', 'zellepay.com',
      'westernunion.com', 'moneygram.com', 'pay.amazon.co.uk',
    ],
    keywords: [
      'bank', 'banking', 'finance', 'financial', 'invest', 'investing',
      'investment', 'investments', 'stock', 'stocks', 'market', 'markets',
      'trading', 'trade', 'crypto', 'cryptocurrency', 'bitcoin',
      'ethereum', 'wallet', 'payment', 'payments', 'pay', 'invoice',
      'invoices', 'tax', 'taxes', 'loan', 'loans', 'mortgage', 'credit',
      'debit', 'savings', 'checking', 'budget', 'budgeting', 'accounting',
      'payroll', 'insurance', 'retirement', '401k', 'brokerage',
      'portfolio', 'dividend', 'dividends', 'interest rate',
      'exchange rate', 'currency', 'forex', 'etf', 'etfs', 'mutual fund',
      'hedge fund', 'fintech', 'revenue', 'profit', 'loss', 'earnings',
      'valuation', 'ipo', 'merger', 'acquisition',
    ],
  },
  {
    id: 'crypto',
    label: 'Crypto & DeFi',
    domainWeight: 10,
    keywordWeight: 0,
    domains: [
      'etherscan.io', 'arbiscan.io', 'basescan.org', 'polygonscan.com',
      'blockscout.com', 'solscan.io', 'debank.com', 'zapper.xyz',
      'defillama.com', 'dune.com', 'l2beat.com', 'tokenterminal.com',
      'coingecko.com', 'coinmarketcap.com', 'dexscreener.com', 'uniswap.org',
      'aave.com', 'curve.fi', 'lido.fi', 'sky.money', 'makerdao.com',
      'safe.global', 'tenderly.co', 'snapshot.org', 'tally.xyz',
      'revoke.cash', 'opensea.io', 'ens.domains', 'metamask.io', 'rabby.io',
    ],
    keywords: [],
  },
  {
    id: 'learning',
    label: 'Learning',
    domainWeight: 4,
    keywordWeight: 5,
    domains: [
      'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org',
      'duolingo.com', 'brilliant.org', 'leetcode.com', 'hackerrank.com',
      'exercism.org', 'codewars.com', 'freecodecamp.org',
      'codecademy.com', 'datacamp.com', 'udacity.com', 'pluralsight.com',
      'skillshare.com', 'masterclass.com', 'openstax.org', 'ocw.mit.edu',
      'online.stanford.edu', 'online-learning.harvard.edu',
      'wikipedia.org', 'britannica.com', 'wolframalpha.com',
      'mathway.com', 'symbolab.com', 'desmos.com', 'geogebra.org',
      'quizlet.com', 'apps.ankiweb.net', 'memrise.com', 'babbel.com',
      'rosettastone.com', 'italki.com', 'preply.com', 'verbling.com',
    ],
    keywords: [
      'course', 'courses', 'learn', 'learning', 'tutorial', 'tutorials',
      'lesson', 'lessons', 'academy', 'bootcamp', 'leetcode', 'practice',
      'exercise', 'exercises', 'quiz', 'quizzes', 'exam', 'exams',
      'study', 'education', 'school', 'university', 'college', 'lecture',
      'lectures', 'class', 'classes', 'curriculum', 'certificate',
      'degree', 'research', 'paper', 'papers', 'thesis', 'textbook',
      'flashcards', 'language', 'vocabulary', 'grammar', 'math',
      'mathematics', 'science', 'history', 'physics', 'chemistry',
      'biology', 'geography', 'literature', 'philosophy', 'psychology',
      'economics',
    ],
  },
  {
    id: 'making',
    label: 'Making',
    domainWeight: 10,
    keywordWeight: 0,
    domains: [
      'printables.com', 'thingiverse.com', 'makerworld.com', 'thangs.com',
      'cults3d.com', 'myminifactory.com', 'prusa3d.com', 'bambulab.com',
      'creality.com', 'anycubic.com', 'instructables.com',
    ],
    keywords: [],
  },
  {
    id: 'travel',
    label: 'Travel',
    domainWeight: 10,
    keywordWeight: 5,
    domains: [
      'booking.com', 'airbnb.com', 'expedia.com', 'hotels.com',
      'kayak.com', 'skyscanner.com', 'skyscanner.net', 'tripadvisor.com',
      'trivago.com', 'agoda.com', 'priceline.com', 'orbitz.com',
      'travelocity.com', 'hotwire.com', 'momondo.com', 'uber.com',
      'lyft.com', 'bolt.eu', 'grab.com', 'gojek.com', 'didiglobal.com',
      'rome2rio.com', 'citymapper.com', 'trainline.com', 'amtrak.com',
      'delta.com', 'united.com', 'aa.com', 'lufthansa.com',
      'emirates.com', 'qatarairways.com', 'ryanair.com', 'easyjet.com',
      'southwest.com', 'jetblue.com', 'alaskaair.com',
      'britishairways.com', 'airfrance.com', 'klm.com', 'iberia.com',
      'tapairportugal.com', 'turkishairlines.com', 'singaporeair.com',
      'cathaypacific.com', 'ana.co.jp', 'jal.co.jp', 'qantas.com',
      'airnewzealand.com', 'marriott.com', 'hilton.com', 'hyatt.com',
      'ihg.com', 'accor.com', 'wyndham.com', 'bestwestern.com',
      'radissonhotels.com', 'travelodge.co.uk', 'premierinn.com',
      'hostelworld.com', 'vrbo.com', 'trip.com', 'kiwi.com', 'hopper.com',
    ],
    keywords: [
      'travel', 'flight', 'flights', 'hotel', 'hotels', 'booking',
      'trip', 'trips', 'vacation', 'holiday', 'holidays', 'airbnb',
      'uber', 'lyft', 'train', 'trains', 'bus', 'buses', 'car rental',
      'rental car', 'airport', 'airline', 'airlines', 'destination',
      'destinations', 'itinerary', 'tourism', 'tour', 'tours', 'cruise',
      'resort', 'resorts', 'hostel', 'hostels', 'luggage', 'passport',
      'visa', 'map', 'maps', 'directions', 'navigation',
    ],
  },
  {
    id: 'health',
    label: 'Health',
    domainWeight: 10,
    keywordWeight: 5,
    domains: [
      'mayoclinic.org', 'webmd.com', 'healthline.com',
      'medicalnewstoday.com', 'nih.gov', 'cdc.gov', 'who.int', 'nhs.uk',
      'clevelandclinic.org', 'hopkinsmedicine.org', 'health.harvard.edu',
      'verywellhealth.com', 'everydayhealth.com', 'drugs.com',
      'rxlist.com', 'goodrx.com', 'singlecare.com', 'fitbit.com',
      'myfitnesspal.com', 'strava.com', 'peloton.com', 'calm.com',
      'headspace.com', 'betterhelp.com', 'talkspace.com', 'cerebral.com',
      'hims.com', 'hers.com', 'roman.com', 'zocdoc.com',
      'healthgrades.com', 'patientslikeme.com', '23andme.com',
      'ancestry.com', 'teladoc.com',
    ],
    keywords: [
      'health', 'medical', 'medicine', 'doctor', 'doctors', 'hospital',
      'hospitals', 'clinic', 'clinics', 'symptom', 'symptoms', 'disease',
      'diseases', 'treatment', 'treatments', 'therapy', 'therapist',
      'mental health', 'fitness', 'workout', 'workouts', 'diet',
      'nutrition', 'weight loss', 'sleep', 'stress', 'anxiety',
      'depression', 'medication', 'prescription', 'pharmacy', 'vaccine',
      'covid', 'pregnancy', 'skincare', 'dental', 'dentist', 'eye',
      'vision', 'hearing', 'blood pressure', 'cholesterol', 'diabetes',
      'cancer', 'pain', 'injury', 'recovery', 'wellness', 'wellbeing',
    ],
  },
  {
    id: 'homelab',
    label: 'Homelab',
    domainWeight: 10,
    keywordWeight: 0,
    domains: [
      'ts.net', 'tailscale.com', 'unifi.ui.com', 'nabu.casa', 'quickconnect.to',
      'synology.me', 'home-assistant.io', 'jellyfin.org', 'linuxserver.io',
      'selfh.st', 'proxmox.com', 'truenas.com', 'unraid.net', 'local', 'lan',
      'home.arpa', 'internal',
    ],
    hostPatterns: [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
      /^172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
      /^[a-z0-9-]+$/,
    ],
    keywords: [],
  },
  {
    id: 'other',
    label: 'Other',
    domainWeight: 0,
    keywordWeight: 0,
    domains: [],
    keywords: [],
  },
];

const CATEGORY_INDEX = new Map(
  CATEGORIES.map((category, index) => [category.id, index]),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const category of CATEGORIES) {
  if (category.keywords.length > 0) category.keywordPattern = keywordPattern(category.keywords);
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function pathOf(url) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function domainMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function findDomainCategory(hostname) {
  let best = null;

  for (const category of CATEGORIES) {
    for (const domain of category.domains) {
      if (!domainMatches(hostname, domain)) continue;
      if (!best || domain.length > best.domain.length) {
        best = { category, domain };
      }
    }
  }

  return best?.category ?? null;
}

// Private IPv4 ranges and dotless intranet names like `nas` or `router` have no
// domain suffix to list, so they match by pattern, and only for web URLs:
// extension IDs and `about:` pages would otherwise look like dotless names.
function findHostPatternCategory(url, hostname) {
  if (!/^https?:/i.test(url || '')) return null;
  return CATEGORIES.find(
    (category) => category.hostPatterns?.some((pattern) => pattern.test(hostname)),
  ) ?? null;
}

function keywordPattern(keywords) {
  const body = keywords
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  return new RegExp(`(?:^|[^a-z0-9])(${body})(?![a-z0-9])`, 'g');
}

const pathHasPrefix = (path, prefix) =>
  prefix === '' || path === prefix || path.startsWith(`${prefix}/`);

const NO_CUSTOM_GROUPS = { categories: [], domainRules: [], keywordRules: [] };

/**
 * Turns the user's custom groups into category objects and match rules. Domain
 * rules are sorted most specific first: a path prefix beats a bare host, and a
 * longer entry beats a shorter one, so the first matching rule wins.
 */
export function compileCustomGroups(groups) {
  if (groups.length === 0) return NO_CUSTOM_GROUPS;

  const categories = groups.map((group, order) => ({
    id: `custom:${group.id}`,
    groupId: group.id,
    label: group.label,
    color: group.color,
    custom: true,
    order,
  }));

  const domainRules = groups
    .flatMap((group, order) => group.domains.map((entry) => {
      const slash = entry.indexOf('/');
      const host = slash === -1 ? entry : entry.slice(0, slash);
      const path = slash === -1 ? '' : entry.slice(slash);
      return { host, path, order, category: categories[order] };
    }))
    .sort((a, b) =>
      Number(Boolean(b.path)) - Number(Boolean(a.path)) ||
      (b.host.length + b.path.length) - (a.host.length + a.path.length) ||
      a.order - b.order);

  const keywordRules = groups
    .map((group, order) => (group.keywords.length > 0
      ? { pattern: keywordPattern(group.keywords), category: categories[order] }
      : null))
    .filter(Boolean);

  return { categories, domainRules, keywordRules };
}

function countMatches(text, pattern) {
  if (!text) return 0;
  return (text.match(pattern) || []).length;
}

export function categorizeTab(tab, custom = NO_CUSTOM_GROUPS) {
  const hostname = hostnameOf(tab.url);
  const title = (tab.title || '').toLowerCase();
  const path = pathOf(tab.url);

  for (const rule of custom.domainRules) {
    if (domainMatches(hostname, rule.host) && pathHasPrefix(path, rule.path)) return rule.category;
  }
  for (const rule of custom.keywordRules) {
    if (countMatches(title, rule.pattern) > 0 || countMatches(path, rule.pattern) > 0) return rule.category;
  }

  const scores = new Map();

  const domainCategory = findDomainCategory(hostname) ??
    findHostPatternCategory(tab.url, hostname);
  if (domainCategory) {
    scores.set(domainCategory.id, domainCategory.domainWeight);
  }

  for (const category of CATEGORIES) {
    if (!category.keywordPattern) continue;

    const titleMatches = countMatches(title, category.keywordPattern);
    if (titleMatches > 0) {
      const current = scores.get(category.id) || 0;
      scores.set(
        category.id,
        current + category.keywordWeight,
      );
    }

    const pathMatches = countMatches(path, category.keywordPattern);
    if (pathMatches > 0) {
      const current = scores.get(category.id) || 0;
      scores.set(
        category.id,
        current + Math.ceil(category.keywordWeight / 2) * Math.min(pathMatches, 1),
      );
    }
  }

  let best = null;

  for (const category of CATEGORIES) {
    const score = scores.get(category.id) || 0;
    if (score > 0 && (!best || score > best.score)) {
      best = { category, score };
    }
  }

  return best?.category ?? CATEGORIES[CATEGORY_INDEX.get('other')];
}

export { CATEGORIES, CATEGORY_INDEX };
