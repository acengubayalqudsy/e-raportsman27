import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../../components/common/Icon.jsx'
import exploreService from '../../services/exploreService.js'
import './Jelajah.css'

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'indonesia', label: 'Indonesia' },
  { id: 'internasional', label: 'Internasional' },
  { id: 'teknologi', label: 'Teknologi Pendidikan' },
  { id: 'kebijakan', label: 'Kebijakan' },
  { id: 'beasiswa', label: 'Beasiswa' },
]

function formatNewsDate(isoString) {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    const diffHours = Math.round((now - date) / (1000 * 60 * 60))
    if (diffHours <= 0) return 'Baru saja'
    if (diffHours < 24) return `${diffHours} jam lalu`
    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 7) return `${diffDays} hari lalu`
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function Jelajah() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load news from backend
  const loadNews = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await exploreService.getNews({
        category: activeCategory,
        q: debouncedQuery,
      })
      if (res.success) {
        setArticles(res.data)
      } else {
        setError(res.error || 'Berita belum dapat dimuat.')
      }
    } catch {
      setError('Berita belum dapat dimuat. Periksa koneksi internet Anda.')
    } finally {
      setIsLoading(false)
    }
  }, [activeCategory, debouncedQuery])

  useEffect(() => {
    let ignore = false
    exploreService.getNews({
      category: activeCategory,
      q: debouncedQuery,
    }).then((res) => {
      if (ignore) return
      if (res.success) {
        setArticles(res.data)
      } else {
        setError(res.error || 'Berita belum dapat dimuat.')
      }
      setIsLoading(false)
    }).catch(() => {
      if (!ignore) {
        setError('Berita belum dapat dimuat. Periksa koneksi internet Anda.')
        setIsLoading(false)
      }
    })
    return () => { ignore = true }
  }, [activeCategory, debouncedQuery])

  // Segmentation for sections
  const { headline, latestNews, indonesiaNews, internationalNews } = useMemo(() => {
    if (!articles || articles.length === 0) {
      return { headline: null, latestNews: [], indonesiaNews: [], internationalNews: [] }
    }

    const first = articles[0]
    const rest = articles.slice(1)

    const indo = articles.filter((a) => a.country === 'ID')
    const intl = articles.filter((a) => a.country === 'INTERNATIONAL')

    return {
      headline: first,
      latestNews: rest.slice(0, 4),
      indonesiaNews: indo.slice(0, 6),
      internationalNews: intl.slice(0, 6),
    }
  }, [articles])

  return (
    <div className="jelajah-page">
      <div className="jelajah-container">
        {/* Header Mobile & Desktop */}
        <header className="jelajah-header-card">
          <div className="jelajah-header-copy">
            <span className="jelajah-badge-top">E-Kliping & Portal Edukasi</span>
            <h1 className="jelajah-title">Jelajah</h1>
            <p className="jelajah-subtitle">Berita & informasi pendidikan terbaru</p>
          </div>

          {/* Search bar */}
          <div className="jelajah-search-box" role="search">
            <Icon name="search" className="jelajah-search-icon" />
            <input
              type="search"
              className="jelajah-search-input"
              placeholder="Cari berita pendidikan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari berita pendidikan"
            />
            {searchQuery && (
              <button
                type="button"
                className="jelajah-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
              >
                &times;
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <nav className="jelajah-category-scroll no-scrollbar" aria-label="Kategori Berita">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`jelajah-chip ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                  aria-pressed={isActive}
                >
                  {category.label}
                </button>
              )
            })}
          </nav>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="jelajah-skeleton-wrapper" aria-label="Memuat berita">
            <div className="jelajah-skeleton-headline">
              <div className="jelajah-skeleton-img skeleton-pulse" />
              <div className="jelajah-skeleton-content">
                <div className="jelajah-skeleton-line short skeleton-pulse" />
                <div className="jelajah-skeleton-line title skeleton-pulse" />
                <div className="jelajah-skeleton-line skeleton-pulse" />
                <div className="jelajah-skeleton-line medium skeleton-pulse" />
              </div>
            </div>
            <div className="jelajah-skeleton-list">
              {[1, 2, 3].map((i) => (
                <div className="jelajah-skeleton-item" key={i}>
                  <div className="jelajah-skeleton-thumb skeleton-pulse" />
                  <div className="jelajah-skeleton-text-group">
                    <div className="jelajah-skeleton-line title skeleton-pulse" />
                    <div className="jelajah-skeleton-line medium skeleton-pulse" />
                    <div className="jelajah-skeleton-line short skeleton-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="jelajah-error-card" role="alert">
            <div className="jelajah-error-icon-box">
              <Icon name="information" />
            </div>
            <h2 className="jelajah-error-title">Berita belum dapat dimuat</h2>
            <p className="jelajah-error-desc">
              {error || 'Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.'}
            </p>
            <button type="button" className="jelajah-retry-btn" onClick={loadNews}>
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty Search State */}
        {!isLoading && !error && articles.length === 0 && (
          <div className="jelajah-empty-card">
            <div className="jelajah-empty-icon-box">
              <Icon name="search" />
            </div>
            <h2 className="jelajah-empty-title">Tidak ada berita ditemukan</h2>
            <p className="jelajah-empty-desc">
              {searchQuery
                ? `Tidak ditemukan artikel untuk kata kunci "${searchQuery}".`
                : 'Belum ada artikel yang cocok dengan filter yang dipilih.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                className="jelajah-retry-btn"
                onClick={() => setSearchQuery('')}
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}

        {/* Main Content when data is ready */}
        {!isLoading && !error && articles.length > 0 && (
          <div className="jelajah-feed">
            {/* 1. Headline Card */}
            {headline && (
              <article className="jelajah-headline-card">
                <div className="jelajah-headline-img-wrapper">
                  <img
                    src={headline.image}
                    alt={headline.title}
                    className="jelajah-headline-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80'
                    }}
                  />
                  <div className="jelajah-headline-badge-group">
                    <span className={`jelajah-badge-country ${headline.country === 'ID' ? 'id' : 'intl'}`}>
                      {headline.country === 'ID' ? 'INDONESIA' : 'INTERNASIONAL'}
                    </span>
                    {headline.category && (
                      <span className="jelajah-badge-cat">
                        {headline.category.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="jelajah-headline-body">
                  <h2 className="jelajah-headline-title">
                    <a
                      href={headline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jelajah-link"
                    >
                      {headline.title}
                    </a>
                  </h2>

                  <p className="jelajah-headline-desc">{headline.description}</p>

                  <div className="jelajah-headline-footer">
                    <div className="jelajah-meta">
                      <span className="jelajah-source">{headline.source}</span>
                      <span className="jelajah-dot">•</span>
                      <span className="jelajah-time">{formatNewsDate(headline.published_at)}</span>
                    </div>

                    <a
                      href={headline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jelajah-read-btn"
                      aria-label={`Baca selengkapnya tentang ${headline.title}`}
                    >
                      Baca Selengkapnya
                      <Icon name="chevronRight" className="jelajah-btn-icon" />
                    </a>
                  </div>
                </div>
              </article>
            )}

            {/* 2. Berita Terbaru Section */}
            {latestNews.length > 0 && (
              <section className="jelajah-section" aria-label="Berita Terbaru">
                <div className="jelajah-section-header">
                  <h2 className="jelajah-section-title">Berita Terbaru</h2>
                  <span className="jelajah-section-sub">Informasi paling mutakhir seputar pendidikan</span>
                </div>

                <div className="jelajah-news-list">
                  {latestNews.map((item) => (
                    <article className="jelajah-list-card" key={item.id}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="jelajah-list-thumb-link"
                        tabIndex="-1"
                        aria-hidden="true"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="jelajah-list-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&auto=format&fit=crop&q=80'
                          }}
                        />
                      </a>

                      <div className="jelajah-list-content">
                        <div className="jelajah-list-meta-top">
                          <span className={`jelajah-badge-country small ${item.country === 'ID' ? 'id' : 'intl'}`}>
                            {item.country === 'ID' ? 'INDONESIA' : 'INTERNASIONAL'}
                          </span>
                          <span className="jelajah-time">{formatNewsDate(item.published_at)}</span>
                        </div>

                        <h3 className="jelajah-list-title">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jelajah-link"
                          >
                            {item.title}
                          </a>
                        </h3>

                        <p className="jelajah-list-desc">{item.description}</p>

                        <div className="jelajah-list-footer">
                          <span className="jelajah-source">{item.source}</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jelajah-inline-read"
                          >
                            Buka Sumber ↗
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Section Indonesia (Pendidikan Indonesia) */}
            {indonesiaNews.length > 0 && activeCategory !== 'internasional' && (
              <section className="jelajah-section" aria-label="Pendidikan Indonesia">
                <div className="jelajah-section-header">
                  <div className="jelajah-section-header-copy">
                    <h2 className="jelajah-section-title">Pendidikan Indonesia</h2>
                    <span className="jelajah-section-sub">
                      Sekolah, guru, kurikulum, kebijakan, dan beasiswa nasional
                    </span>
                  </div>
                </div>

                <div className="jelajah-grid-cards">
                  {indonesiaNews.map((item) => (
                    <article className="jelajah-grid-card" key={`indo-${item.id}`}>
                      <div className="jelajah-grid-thumb-box">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="jelajah-grid-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80'
                          }}
                        />
                        <span className="jelajah-badge-country small id">INDONESIA</span>
                      </div>

                      <div className="jelajah-grid-body">
                        <span className="jelajah-time">{formatNewsDate(item.published_at)}</span>
                        <h3 className="jelajah-grid-title">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jelajah-link"
                          >
                            {item.title}
                          </a>
                        </h3>
                        <p className="jelajah-grid-desc">{item.description}</p>
                        <div className="jelajah-grid-footer">
                          <span className="jelajah-source">{item.source}</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jelajah-inline-read"
                          >
                            Baca ↗
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Section Internasional (Pendidikan Dunia) */}
            {internationalNews.length > 0 && activeCategory !== 'indonesia' && (
              <section className="jelajah-section" aria-label="Pendidikan Dunia">
                <div className="jelajah-section-header">
                  <div className="jelajah-section-header-copy">
                    <h2 className="jelajah-section-title">Pendidikan Dunia</h2>
                    <span className="jelajah-section-sub">
                      Pendidikan global, riset universitas, teknologi AI, dan UNESCO
                    </span>
                  </div>
                </div>

                <div className="jelajah-grid-cards">
                  {internationalNews.map((item) => (
                    <article className="jelajah-grid-card" key={`intl-${item.id}`}>
                      <div className="jelajah-grid-thumb-box">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="jelajah-grid-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&auto=format&fit=crop&q=80'
                          }}
                        />
                        <span className="jelajah-badge-country small intl">INTERNASIONAL</span>
                      </div>

                      <div className="jelajah-grid-body">
                        <span className="jelajah-time">{formatNewsDate(item.published_at)}</span>
                        <h3 className="jelajah-grid-title">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jelajah-link"
                          >
                            {item.title}
                          </a>
                        </h3>
                        <p className="jelajah-grid-desc">{item.description}</p>
                        <div className="jelajah-grid-footer">
                          <span className="jelajah-source">{item.source}</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jelajah-inline-read"
                          >
                            Baca ↗
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Jelajah
