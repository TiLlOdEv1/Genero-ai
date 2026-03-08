import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Sparkles, 
    Image as ImageIcon, 
    Video, 
    Settings, 
    Download, 
    History, 
    AlertCircle, 
    CheckCircle, 
    Loader2, 
    Cpu, 
    Clock3, 
    Eye, 
    Trash2,
    Zap, 
    ChevronDown, 
    ChevronUp, 
    Layers, 
    Copy, 
    Share2,
    Github, 
    Twitter, 
    Menu, 
    Sun, 
    Moon, 
    Brush, 
    X,
    Camera,
    Heart,
    Palette,
    Wand2,
    Sparkle,
    Maximize2,
    Minimize2,
    Grid,
    List,
    Search,
    Check,
    Info,
    LogOut,
    LogIn,
    User,
    Bookmark,
    MessageCircle,
    ThumbsUp,
    Send,
    PenTool,
    Type,
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Circle,
    Square,
    Triangle,
    Hexagon,
    Star,
    Award,
    Rocket,
    TrendingUp,
    Users,
    Target,
    Zap as ZapIcon,
    Filter,
    Plus,
    Minus,
    RefreshCw,
    Globe,
    Bell,
    Mail,
    Phone,
    MapPin,
    Link as LinkIcon,
    Coffee,
    Feather
} from 'lucide-react';
import "./App.css"

function App() {
    const [activeTab, setActiveTab] = useState('image');
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [generatingProgress, setGeneratingProgress] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [showHistory, setShowHistory] = useState(true);
    const [processingTime, setProcessingTime] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [notifications, setNotifications] = useState([]);
    const [selectedStyle, setSelectedStyle] = useState('photorealistic');
    const [selectedRatio, setSelectedRatio] = useState('1:1');
    const [favorites, setFavorites] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [stats, setStats] = useState({
        totalGenerations: 0,
        totalTime: 0
    });

    const canvasRef = useRef(null);
    const API_URL = process.env.REACT_APP_API_URL || 'https://genero-backend.onrender.com/api';

    // ==================== BACKGROUND ANIMATION ====================
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = Math.random() * 0.2 - 0.1;
                this.speedY = Math.random() * 0.2 - 0.1;
                // this.color = `rgba(100, 100, 255, ${Math.random() * 0.1})`;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#0a0a0f');
            gradient.addColorStop(1, '#1a1a2e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            if (mousePosition.x && mousePosition.y) {
                const gradient = ctx.createRadialGradient(
                    mousePosition.x, mousePosition.y, 0,
                    mousePosition.x, mousePosition.y, 150
                );
                gradient.addColorStop(0, 'rgba(255, 200, 100, 0.05)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [mousePosition]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const savedHistory = localStorage.getItem('genero_history');
        if (savedHistory) {
            const parsed = JSON.parse(savedHistory);
            setHistory(parsed);
            setStats(prev => ({ 
                ...prev, 
                totalGenerations: parsed.length,
                totalTime: parsed.reduce((acc, item) => acc + (item.time || 0), 0)
            }));
        }

        const savedFavorites = localStorage.getItem('genero_favorites');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('genero_history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        localStorage.setItem('genero_favorites', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        let interval;
        if (loading) {
            setGeneratingProgress(0);
            interval = setInterval(() => {
                setGeneratingProgress(prev => {
                    if (prev >= 95) return 95;
                    return prev + Math.random() * 15;
                });
            }, 200);
        } else {
            setGeneratingProgress(100);
            setTimeout(() => {
                setGeneratingProgress(0);
                if (generatedImage) {
                    setShowPreview(true);
                }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [loading, generatedImage]);

    const addNotification = (message, type = 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const generateImage = async () => {
        if (!prompt.trim()) {
            setError('Iltimos, rasm haqida yozing');
            return;
        }

        setLoading(true);
        setError('');
        setShowPreview(false);
        setGeneratedImage(null);
        setProcessingTime(null);

        const startTime = Date.now();

        try {
            const response = await axios.post(`${API_URL}/generate/image`, {
                prompt: prompt,
                negative_prompt: negativePrompt || '',
                width: 1024,
                height: 1024,
                style: selectedStyle
            });

            const endTime = Date.now();
            const time = endTime - startTime;
            setProcessingTime(time);

            if (response.data.image_url) {
                setGeneratedImage(response.data.image_url);
                
                const newItem = {
                    id: Date.now(),
                    prompt,
                    url: response.data.image_url,
                    date: new Date().toISOString(),
                    time: time,
                    style: selectedStyle,
                    ratio: selectedRatio
                };
                
                setHistory(prev => {
                    const updated = [newItem, ...prev].slice(0, 50);
                    setStats(s => ({ 
                        ...s, 
                        totalGenerations: updated.length,
                        totalTime: updated.reduce((acc, item) => acc + (item.time || 0), 0)
                    }));
                    return updated;
                });
                
                addNotification('Rasm tayyor');
            }
        } catch (err) {
            console.error('Xatolik:', err);
            setError('Rasm yaratishda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `genero-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            addNotification('Rasm yuklandi');
        } catch (err) {
            addNotification('Yuklab olishda xatolik', 'error');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        addNotification('Nusxalandi');
    };

    const toggleFavorite = (item) => {
        if (favorites.some(f => f.id === item.id)) {
            setFavorites(favorites.filter(f => f.id !== item.id));
            addNotification('Sevimlilardan olib tashlandi');
        } else {
            setFavorites([...favorites, { ...item, favorite: true }]);
            addNotification('Sevimlilarga qo\'shildi');
        }
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('genero_history');
        setStats({ totalGenerations: 0, totalTime: 0 });
        addNotification('Tarix tozalandi');
    };

    const formatTime = (ms) => {
        if (!ms) return '—';
        return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    };

    const styles = [
        { id: 'photorealistic', name: 'Realistik', icon: Camera },
        { id: 'cinematic', name: 'Kinematik', icon: Video },
        { id: 'anime', name: 'Anime', icon: Sparkles },
        { id: 'fantasy', name: 'Fantaziya', icon: Wand2 },
        { id: 'cyberpunk', name: 'Cyberpunk', icon: Cpu },
        { id: 'sketch', name: 'Eskiz', icon: PenTool },
        { id: 'oil-painting', name: 'Yog\'li rasm', icon: Palette },
        { id: '3d-render', name: '3D', icon: Square }
    ];

    const ratios = [
        { id: '1:1', name: '1:1', icon: Square },
        { id: '16:9', name: '16:9', icon: Maximize2 },
        { id: '9:16', name: '9:16', icon: Minimize2 },
        { id: '4:3', name: '4:3', icon: Grid }
    ];

    const filteredHistory = history.filter(item => 
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`app ${darkMode ? 'dark' : 'light'}`}>
            <canvas ref={canvasRef} className="background-canvas" />

            <div className="notifications-container">
                {notifications.map(notif => (
                    <div key={notif.id} className={`notification ${notif.type}`}>
                        {notif.type === 'success' && <CheckCircle size={18} />}
                        {notif.type === 'error' && <AlertCircle size={18} />}
                        <span>{notif.message}</span>
                    </div>
                ))}
            </div>

            <div className="main-container">
                {/* Header - TOZA LOGO */}
                <header className="header">
                    <div className="header-content">
                        <div className="logo-section">
                            <h1 className="logo">
                                Genero<span className="logo-dot">.</span>ai
                            </h1>
                            
                            <div className="stats-wrapper">
                                <div className="stat-item">
                                    <History size={14} />
                                    <span>{stats.totalGenerations}</span>
                                </div>
                                <div className="stat-item">
                                    <Clock3 size={14} />
                                    <span>
                                        {stats.totalGenerations > 0 
                                            ? formatTime(stats.totalTime / stats.totalGenerations)
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="header-actions">
                            <button 
                                className={`icon-button`}
                                onClick={() => setDarkMode(!darkMode)}>
                                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button className="icon-button">
                                <Github size={20} />
                            </button>
                            <button className="icon-button">
                                <Menu size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="header-subtitle">
                        <Sparkles size={16} />
                        <span>Rasm yaratish</span>
                    </div>
                </header>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab ${activeTab === 'image' ? 'active' : ''}`}
                        onClick={() => setActiveTab('image')}>
                        <ImageIcon size={20} />
                        <span>Rasm</span>
                    </button>
                    <button
                        className={`tab ${activeTab === 'video' ? 'active' : ''}`}
                        disabled>
                        <Video size={20} />
                        <span>Video</span>
                        <span className="coming-soon">Tez kunda</span>
                    </button>
                </div>

                {/* Style Selector */}
                <div className="style-selector">
                    {styles.map(style => {
                        const Icon = style.icon;
                        const isSelected = selectedStyle === style.id;
                        return (
                            <button
                                key={style.id}
                                className={`style-button ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedStyle(style.id)}>
                                <Icon size={14} />
                                <span>{style.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Ratio Selector */}
                <div className="ratio-selector">
                    {ratios.map(ratio => {
                        const Icon = ratio.icon;
                        const isSelected = selectedRatio === ratio.id;
                        return (
                            <button
                                key={ratio.id}
                                className={`ratio-button ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedRatio(ratio.id)}>
                                <Icon size={12} />
                                <span>{ratio.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Input Section */}
                <div className="input-section">
                    <div className="input-wrapper">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Masalan: red fox in snow, mountain landscape, cyberpunk city..."
                            className="prompt-input"
                            rows="3"
                            disabled={loading}
                        />
                        {!loading && prompt && (
                            <button 
                                className="clear-button"
                                onClick={() => setPrompt('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="input-wrapper negative">
                        <input
                            type="text"
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="✖️ Nimani istamaysiz? (ixtiyoriy)"
                            className="negative-input"
                            disabled={loading}
                        />
                    </div>

                    <button
                        className={`generate-button ${loading ? 'generating' : ''}`}
                        onClick={generateImage}
                        disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 size={20} className="spinner" />
                                <span>Yaratilmoqda...</span>
                                <span className="progress-percent">{Math.round(generatingProgress)}%</span>
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                <span>Yaratish</span>
                            </>
                        )}
                    </button>

                    {loading && (
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${generatingProgress}%` }} />
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                            <button className="close-error" onClick={() => setError('')}>
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Results Grid */}
                <div className="results-grid">
                    {/* Generated Image */}
                    <div className="result-card">
                        <div className="card-header">
                            <h3 className="card-title">
                                {loading ? 'Yaratilmoqda' : generatedImage ? 'Natija' : 'Yangi rasm'}
                            </h3>
                            {processingTime && (
                                <span className="processing-time">{formatTime(processingTime)}</span>
                            )}
                        </div>

                        <div className="card-content">
                            {loading ? (
                                <div className="generating-placeholder">
                                    <Cpu size={40} />
                                    <p>Rasm yaratilmoqda...</p>
                                </div>
                            ) : generatedImage ? (
                                <div className="image-container">
                                    <img 
                                        src={generatedImage} 
                                        alt={prompt} 
                                        className="generated-image"
                                    />
                                    <div className="image-actions">
                                        <button onClick={() => downloadImage(generatedImage)} title="Yuklab olish">
                                            <Download size={16} />
                                        </button>
                                        <button onClick={() => copyToClipboard(generatedImage)} title="Nusxalash">
                                            <Copy size={16} />
                                        </button>
                                        <button onClick={() => window.open(generatedImage, '_blank')} title="Katta ko'rinish">
                                            <Maximize2 size={16} />
                                        </button>
                                        <button 
                                            className={favorites.some(f => f.url === generatedImage) ? 'active' : ''}
                                            onClick={() => toggleFavorite({
                                                id: Date.now(),
                                                prompt,
                                                url: generatedImage,
                                                date: new Date().toISOString()
                                            })} 
                                            title="Sevimlilar">
                                            <Heart size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Brush size={48} />
                                    <p>Prompt yozing va yaratishni boshlang</p>
                                    <div className="example-prompts">
                                        <button onClick={() => setPrompt("red fox in snow")}>red fox</button>
                                        <button onClick={() => setPrompt("mountain landscape")}>mountain</button>
                                        <button onClick={() => setPrompt("cyberpunk city")}>cyberpunk</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History */}
                    <div className="result-card">
                        <div className="card-header">
                            <div className="header-tabs">
                                <button 
                                    className={showHistory ? 'active' : ''}
                                    onClick={() => setShowHistory(true)}>
                                    <History size={14} />
                                    Tarix
                                </button>
                                <button 
                                    className={!showHistory ? 'active' : ''}
                                    onClick={() => setShowHistory(false)}>
                                    <Heart size={14} />
                                    Sevimlilar
                                    {favorites.length > 0 && (
                                        <span className="badge">{favorites.length}</span>
                                    )}
                                </button>
                            </div>
                            
                            <div className="header-actions">
                                <div className="search-box">
                                    <Search size={12} />
                                    <input
                                        type="text"
                                        placeholder="Qidirish"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                                    {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
                                </button>
                                {showHistory && history.length > 0 && (
                                    <button onClick={clearHistory}>
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={`history-list ${viewMode}`}>
                            {showHistory ? (
                                filteredHistory.length === 0 ? (
                                    <div className="empty-history">
                                        <History size={32} />
                                        <p>Tarix bo'sh</p>
                                    </div>
                                ) : (
                                    filteredHistory.map((item, index) => (
                                        <div key={item.id} className="history-item">
                                            <img src={item.url} alt={item.prompt} />
                                            <div className="history-item-info">
                                                <p>{item.prompt}</p>
                                                <span>{new Date(item.date).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="history-item-actions">
                                                <button onClick={() => downloadImage(item.url)}>
                                                    <Download size={12} />
                                                </button>
                                                <button 
                                                    className={favorites.some(f => f.id === item.id) ? 'active' : ''}
                                                    onClick={() => toggleFavorite(item)}>
                                                    <Heart size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                favorites.length === 0 ? (
                                    <div className="empty-history">
                                        <Heart size={32} />
                                        <p>Sevimlilar bo'sh</p>
                                    </div>
                                ) : (
                                    favorites.map((item) => (
                                        <div key={item.id} className="history-item">
                                            <img src={item.url} alt={item.prompt} />
                                            <div className="history-item-info">
                                                <p>{item.prompt}</p>
                                                <span>{new Date(item.date).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="history-item-actions">
                                                <button onClick={() => downloadImage(item.url)}>
                                                    <Download size={12} />
                                                </button>
                                                <button 
                                                    className="active"
                                                    onClick={() => toggleFavorite(item)}>
                                                    <Heart size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;