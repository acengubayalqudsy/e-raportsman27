<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ExploreNewsController extends Controller
{
    /**
     * Fallback high-quality curated educational articles
     * used when upstream RSS providers are unreachable/offline.
     */
    protected array $fallbackArticles = [
        [
            'id' => 'fallback-id-1',
            'title' => 'Kemendikbudristek Akselerasi Transformasi Pembelajaran Berbasis Digital di SMA',
            'description' => 'Peningkatan kompetensi guru dan integrasi teknologi pembelajaran interaktif menjadi fokus utama kurikulum merdeka tahun ajaran baru.',
            'image' => 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
            'source' => 'Kemendikbudristek RI',
            'published_at' => '2026-10-04T08:30:00Z',
            'category' => 'technology',
            'country' => 'ID',
            'url' => 'https://kemdikbud.go.id',
        ],
        [
            'id' => 'fallback-id-2',
            'title' => 'Pembukaan Pendaftaran Beasiswa Indonesia Maju Program S1 dan S2',
            'description' => 'Pusat Prestasi Nasional membuka kesempatan beasiswa penuh bagi siswa dan pendidik berprestasi untuk melanjutkan studi di dalam dan luar negeri.',
            'image' => 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
            'source' => 'Puspresnas Kemendikbud',
            'published_at' => '2026-10-03T11:15:00Z',
            'category' => 'scholarship',
            'country' => 'ID',
            'url' => 'https://pusatprestasinasional.kemdikbud.go.id',
        ],
        [
            'id' => 'fallback-id-3',
            'title' => 'Kebijakan Penguatan Karakter dan Profil Pelajar Pancasila di Sekolah Menengah',
            'description' => 'Evaluasi holistik pembelajaran kokurikuler menunjukkan peningkatan kemandirian, gotong royong, dan nalar kritis siswa di berbagai daerah.',
            'image' => 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
            'source' => 'Direktorat SMA',
            'published_at' => '2026-10-02T14:00:00Z',
            'category' => 'policy',
            'country' => 'ID',
            'url' => 'https://sma.kemdikbud.go.id',
        ],
        [
            'id' => 'fallback-intl-1',
            'title' => 'UNESCO Releases Global Guidelines on Artificial Intelligence in Primary and Secondary Education',
            'description' => 'The international guidance outlines ethical boundaries, teacher-led integration, and equitable access to AI literacy tools for modern schools.',
            'image' => 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=80',
            'source' => 'UNESCO Education',
            'published_at' => '2026-10-04T10:00:00Z',
            'category' => 'technology',
            'country' => 'INTERNATIONAL',
            'url' => 'https://www.unesco.org/en/education',
        ],
        [
            'id' => 'fallback-intl-2',
            'title' => 'OECD Global Education Survey Highlights Critical Thinking Over Memorisation in STEM',
            'description' => 'Cross-country findings illustrate that schools focusing on inquiry-based problem solving achieved significantly higher student engagement.',
            'image' => 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=80',
            'source' => 'OECD Education GPS',
            'published_at' => '2026-10-03T16:45:00Z',
            'category' => 'education',
            'country' => 'INTERNATIONAL',
            'url' => 'https://www.oecd.org/education',
        ],
    ];

    /**
     * Get aggregated education news.
     * GET /api/v1/explore/news
     */
    public function index(Request $request): JsonResponse
    {
        $category = strtolower((string) $request->query('category', 'all'));
        $query = strtolower(trim((string) $request->query('q', '')));

        // Cache aggregated raw articles for 20 minutes
        $articles = Cache::remember('explore_news_data', now()->addMinutes(20), function () {
            return $this->fetchAggregatedNews();
        });

        // Ensure we always have valid articles
        if (empty($articles)) {
            $articles = $this->fallbackArticles;
        }

        // Apply category filter
        if ($category !== 'all' && $category !== 'semua' && $category !== '') {
            $articles = array_filter($articles, function ($article) use ($category) {
                if ($category === 'indonesia' || $category === 'id') {
                    return $article['country'] === 'ID';
                }
                if ($category === 'internasional' || $category === 'international') {
                    return $article['country'] === 'INTERNATIONAL';
                }
                if ($category === 'teknologi' || $category === 'technology') {
                    return in_array($article['category'], ['technology', 'teknologi'], true);
                }
                if ($category === 'kebijakan' || $category === 'policy') {
                    return in_array($article['category'], ['policy', 'kebijakan'], true);
                }
                if ($category === 'beasiswa' || $category === 'scholarship') {
                    return in_array($article['category'], ['scholarship', 'beasiswa'], true);
                }
                return strtolower($article['category']) === $category;
            });
        }

        // Apply text search query
        if ($query !== '') {
            $articles = array_filter($articles, function ($article) use ($query) {
                return Str::contains(strtolower($article['title']), $query)
                    || Str::contains(strtolower($article['description']), $query)
                    || Str::contains(strtolower($article['source']), $query);
            });
        }

        // Re-index array keys
        $articles = array_values($articles);

        return response()->json([
            'success' => true,
            'data' => $articles,
            'total' => count($articles),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Fetch from live RSS feeds and normalize.
     */
    protected function fetchAggregatedNews(): array
    {
        $articles = [];

        // 1. Fetch Indonesian Education RSS (Google News Education ID)
        try {
            $idResponse = Http::timeout(4)
                ->withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                ->get('https://news.google.com/rss/search?q=pendidikan+indonesia+guru+kurikulum+sekolah&hl=id&gl=ID&ceid=ID:id');

            if ($idResponse->successful()) {
                $idItems = $this->parseRssFeed($idResponse->body(), 'ID', 'education');
                $articles = array_merge($articles, array_slice($idItems, 0, 15));
            }
        } catch (\Throwable $e) {
            // Silently continue to next source
        }

        // 2. Fetch Indonesian Scholarship / Technology RSS
        try {
            $techResponse = Http::timeout(4)
                ->withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                ->get('https://news.google.com/rss/search?q=beasiswa+pendidikan+indonesia&hl=id&gl=ID&ceid=ID:id');

            if ($techResponse->successful()) {
                $techItems = $this->parseRssFeed($techResponse->body(), 'ID', 'scholarship');
                $articles = array_merge($articles, array_slice($techItems, 0, 8));
            }
        } catch (\Throwable $e) {
            // Silently continue to next source
        }

        // 3. Fetch International Education RSS (The Guardian Education)
        try {
            $guardianResponse = Http::timeout(4)
                ->withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                ->get('https://www.theguardian.com/education/rss');

            if ($guardianResponse->successful()) {
                $guardianItems = $this->parseRssFeed($guardianResponse->body(), 'INTERNATIONAL', 'education');
                $articles = array_merge($articles, array_slice($guardianItems, 0, 12));
            }
        } catch (\Throwable $e) {
            // Silently continue
        }

        // 4. Fetch International EdTech / UNESCO / Global RSS
        try {
            $intlResponse = Http::timeout(4)
                ->withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                ->get('https://news.google.com/rss/search?q=global+education+schools+universities+unesco&hl=en-US&gl=US&ceid=US:en');

            if ($intlResponse->successful()) {
                $intlItems = $this->parseRssFeed($intlResponse->body(), 'INTERNATIONAL', 'technology');
                $articles = array_merge($articles, array_slice($intlItems, 0, 10));
            }
        } catch (\Throwable $e) {
            // Silently continue
        }

        // Deduplicate by URL or title
        $unique = [];
        $seen = [];
        foreach ($articles as $item) {
            $key = md5(strtolower(trim($item['title'])));
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $unique[] = $item;
            }
        }

        // If we fetched zero items, merge fallback items
        if (empty($unique)) {
            return $this->fallbackArticles;
        }

        return $unique;
    }

    /**
     * Parse XML RSS content into normalized array format.
     */
    protected function parseRssFeed(string $xmlContent, string $country, string $defaultCategory): array
    {
        $items = [];

        try {
            $xml = @simplexml_load_string($xmlContent, 'SimpleXMLElement', LIBXML_NOCDATA);
            if (!$xml || !isset($xml->channel->item)) {
                return [];
            }

            $curatedImages = [
                'ID' => [
                    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
                ],
                'INTERNATIONAL' => [
                    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
                ],
            ];

            $imgIndex = 0;
            $pool = $curatedImages[$country] ?? $curatedImages['ID'];

            foreach ($xml->channel->item as $entry) {
                $title = trim((string) $entry->title);
                $link = trim((string) $entry->link);
                $pubDate = trim((string) $entry->pubDate);
                $source = isset($entry->source) ? trim((string) $entry->source) : '';

                // Extract source from title if source tag is empty (e.g. "Title - Source")
                if (!$source && Str::contains($title, ' - ')) {
                    $parts = explode(' - ', $title);
                    $source = array_pop($parts);
                    $title = implode(' - ', $parts);
                }

                if (!$source) {
                    $source = $country === 'ID' ? 'Media Pendidikan Indonesia' : 'Global Education';
                }

                // Clean description HTML
                $rawDesc = (string) $entry->description;
                $cleanDesc = trim(strip_tags(html_entity_decode($rawDesc, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
                if (!$cleanDesc || strlen($cleanDesc) < 15) {
                    $cleanDesc = 'Informasi dan perkembangan terkini seputar dunia pendidikan dan pembelajaran sekolah.';
                }
                $cleanDesc = Str::limit($cleanDesc, 180);

                // Image extraction
                $imageUrl = '';
                // Try enclosure
                if (isset($entry->enclosure) && isset($entry->enclosure['url'])) {
                    $imageUrl = (string) $entry->enclosure['url'];
                }
                // Try media namespace
                if (!$imageUrl) {
                    $media = $entry->children('http://search.yahoo.com/mrss/');
                    if (isset($media->content) && isset($media->content->attributes()->url)) {
                        $imageUrl = (string) $media->content->attributes()->url;
                    } elseif (isset($media->thumbnail) && isset($media->thumbnail->attributes()->url)) {
                        $imageUrl = (string) $media->thumbnail->attributes()->url;
                    }
                }
                // Fallback to high quality curated educational photo
                if (!$imageUrl) {
                    $imageUrl = $pool[$imgIndex % count($pool)];
                    $imgIndex++;
                }

                // Detect category from title keywords
                $category = $defaultCategory;
                $titleLower = strtolower($title);
                if (Str::contains($titleLower, ['beasiswa', 'scholarship', 'bantuan', 'kip'])) {
                    $category = 'scholarship';
                } elseif (Str::contains($titleLower, ['ai', 'teknologi', 'digital', 'technology', 'aplikasi', 'gadget', 'online'])) {
                    $category = 'technology';
                } elseif (Str::contains($titleLower, ['kebijakan', 'menteri', 'aturan', 'kurikulum', 'policy', 'pemerintah', 'undang-undang'])) {
                    $category = 'policy';
                }

                // Format published_at to ISO string
                $timestamp = strtotime($pubDate);
                $isoDate = $timestamp ? date('c', $timestamp) : now()->toIso8601String();

                $items[] = [
                    'id' => md5($link ?: $title),
                    'title' => $title,
                    'description' => $cleanDesc,
                    'image' => $imageUrl,
                    'source' => $source,
                    'published_at' => $isoDate,
                    'category' => $category,
                    'country' => $country,
                    'url' => $link,
                ];
            }
        } catch (\Throwable $e) {
            return [];
        }

        return $items;
    }
}
