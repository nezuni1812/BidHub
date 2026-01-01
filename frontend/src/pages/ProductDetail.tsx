"use client"

import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Share2, Flag } from "lucide-react"
import { useState, useEffect } from "react"
import { BidDialog } from "@/components/bid-dialog"
import { AskQuestionDialog } from "@/components/ask-question-dialog"
import { AnswerQuestionDialog } from "@/components/answer-question-dialog"
import { AppendDescriptionDialog } from "@/components/append-description-dialog"
import { DenyBidderDialog } from "@/components/deny-bidder-dialog"
import { useParams, Link } from "react-router-dom"
import { getProductById, getProductBids, formatPrice, formatTimeRemaining, getImageUrl, type Product, type Bid } from "@/lib/products"
import { io, Socket } from "socket.io-client"
import { useToast } from "@/components/ui/use-toast"
import { addToWatchlist, removeFromWatchlist, isInWatchlist as checkWatchlist } from "@/lib/watchlist"
import { askQuestion, answerQuestion } from "@/lib/questions"
import { useAuth } from "@/contexts/AuthContext"

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const [product, setProduct] = useState<Product | null>(null)
    const [bids, setBids] = useState<Bid[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFavorited, setIsFavorited] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showBidDialog, setShowBidDialog] = useState(false)
    const [showQuestionDialog, setShowQuestionDialog] = useState(false)
    const [showAnswerDialog, setShowAnswerDialog] = useState(false)
    const [selectedQuestion, setSelectedQuestion] = useState<{ id: number; question: string; asker_name: string } | null>(null)
    const [showDenyDialog, setShowDenyDialog] = useState(false)
    const [selectedBidder, setSelectedBidder] = useState<{ id: number; name: string } | null>(null)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [myMaxPrice, setMyMaxPrice] = useState<number | null>(null)
    const [currentTime, setCurrentTime] = useState(Date.now())
    
    // Check if current user is winning
    const isWinning = user && product && product.winner_id && parseInt(product.winner_id as any) === parseInt(user.id as any);
    
    // Check if current user is the seller
    const isSeller = user && product && parseInt(product.seller_id as any) === parseInt(user.id as any);

    useEffect(() => {
        if (!id) return;
        
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('🔍 Fetching product:', id);
                const productData = await getProductById(id);
                console.log('✅ Product data:', productData);
                
                // Parse images if they're JSON strings
                if (productData.images) {
                    productData.images = productData.images.map(img => {
                        if (typeof img.url === 'string' && img.url.startsWith('{')) {
                            try {
                                const parsed = JSON.parse(img.url);
                                return { ...img, url: parsed.url };
                            } catch {
                                return img;
                            }
                        }
                        return img;
                    });
                }
                
                setProduct(productData);
                
                // Fetch bid history
                const bidsData = await getProductBids(id);
                console.log('✅ Bids data:', bidsData);
                setBids(bidsData.data);
                
                // Check watchlist status and get max price history
                const token = localStorage.getItem('access_token');
                if (token) {
                    const inWatchlist = await checkWatchlist(parseInt(id));
                    setIsFavorited(inWatchlist);
                    
                    // Fetch user's max price for this product
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
                        const response = await fetch(`${API_URL}/bidder/auto-bid/${id}/history`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (response.ok) {
                            const result = await response.json();
                            if (result.data && result.data.max_price) {
                                setMyMaxPrice(parseFloat(result.data.max_price));
                            }
                        }
                    } catch (err) {
                        console.log('No max price history found');
                    }
                }
                
            } catch (err) {
                console.error('❌ Error fetching product:', err);
                setError(err instanceof Error ? err.message : 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };
        
        fetchProduct();
    }, [id]);
    
    // Socket.IO connection
    useEffect(() => {
        if (!id || !product) return;
        
        const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            console.log('⚠️ No token found, skipping socket connection');
            return;
        }
        
        console.log('🔌 Connecting to socket:', SOCKET_URL);
        
        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });
        
        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            // Join product room
            newSocket.emit('join-product', parseInt(id));
            console.log('📦 Joined product room:', id);
        });
        
        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });
        
        // Listen for new bids
        newSocket.on('new-bid', (data: any) => {
            console.log('💰 New bid received:', data);
            
            setProduct(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    current_price: data.currentPrice,
                    total_bids: data.totalBids,
                    winner_id: data.bidder.id,
                    winner_name: data.bidder.name
                };
            });
            
            // Add to bid history
            setBids(prev => [{
                id: Date.now(),
                bid_price: data.currentPrice,
                is_auto: data.isAutoBid || false,
                created_at: data.timestamp,
                masked_bidder_name: data.bidder.name
            }, ...prev]);
            
            // Show toast notification
            toast({
                title: "Có lượt đặt giá mới!",
                description: `${data.bidder.name} đặt giá ${formatPrice(data.currentPrice)}${data.isAutoBid ? ' (Tự động)' : ''}`,
            });
        });
        
        newSocket.on('auction-extended', (data: any) => {
            console.log('⏰ Auction extended:', data);
            setProduct(prev => {
                if (!prev) return prev;
                return { ...prev, end_time: data.newEndTime };
            });
            
            toast({
                title: "⏰ Đấu giá được gia hạn",
                description: `Gia hạn thêm ${data.extendedMinutes} phút do có lượt đặt giá phút cuối`,
            });
        });
        
        newSocket.on('auction-ended', (data: any) => {
            console.log('🏁 Auction ended:', data);
            setProduct(prev => {
                if (!prev) return prev;
                return { ...prev, status: 'ended' };
            });
            
            toast({
                title: "🏁 Đấu giá kết thúc",
                description: `Giá cuối: ${formatPrice(data.finalPrice)}`,
            });
        });
        
        newSocket.on('outbid', (data: any) => {
            console.log('⚠️ You were outbid:', data);
            toast({
                title: "⚠️ Bạn đã bị vượt giá!",
                description: `Giá mới: ${formatPrice(data.newPrice)}`,
                variant: "destructive"
            });
        });
        
        // Listen for bidder denied events
        newSocket.on('bidder-denied', (data: any) => {
            console.log('🚫 Bidder denied:', data);
            toast({
                title: "🚫 Bạn đã bị từ chối đấu giá",
                description: data.reason || "Người bán đã từ chối bạn tham gia đấu giá sản phẩm này",
                variant: "destructive"
            });
            
            // Refresh product data
            if (id) {
                getProductById(id).then(productData => {
                    setProduct(productData);
                    getProductBids(id).then(bidsData => {
                        setBids(bidsData.data);
                    });
                });
            }
        });
        
        // Listen for price updates (when highest bidder is denied)
        newSocket.on('price-updated', (data: any) => {
            console.log('💰 Price updated:', data);
            
            // Refresh full product data to get new winner_id
            if (id) {
                getProductById(id).then(productData => {
                    setProduct(productData);
                });
                getProductBids(id).then(bidsData => {
                    setBids(bidsData.data);
                });
            }
            
            if (data.reason === 'bidder_denied') {
                toast({
                    title: "💰 Giá đã thay đổi",
                    description: `Giá mới: ${formatPrice(data.new_price)} (người đấu giá cao nhất đã bị từ chối)`,
                });
            }
        });
        
        // Listen for now winning (when you become the highest bidder after someone is denied)
        newSocket.on('now-winning', (data: any) => {
            console.log('🎉 Now winning:', data);
            
            // Refresh full product data to update winner status
            if (id) {
                getProductById(id).then(productData => {
                    setProduct(productData);
                });
            }
            
            toast({
                title: "🎉 Bạn đang dẫn đầu!",
                description: `Giá của bạn ${formatPrice(data.bid_price)} hiện đang cao nhất`,
            });
        });
        
        // Listen for new questions
        newSocket.on('new-question', (data: any) => {
            
            setProduct(prev => {
                if (!prev) return prev;
                const updatedQuestions = [
                    {
                        id: data.question.id,
                        question: data.question.question,
                        asker_name: data.question.user_name,
                        created_at: data.question.created_at,
                        answer: null
                    },
                    ...(prev.questions || [])
                ];
                return { ...prev, questions: updatedQuestions };
            });
            
            toast({
                title: "Câu hỏi mới",
                description: "Có người đã hỏi về sản phẩm này"
            });
        });
        
        // Listen for answered questions
        newSocket.on('question-answered', (data: any) => {
            console.log('✅ Question answered:', data);
            
            setProduct(prev => {
                if (!prev) return prev;
                const updatedQuestions = prev.questions?.map(q => 
                    q.id === data.questionId 
                        ? { ...q, answer: data.answer, answered_at: new Date().toISOString() }
                        : q
                );
                return { ...prev, questions: updatedQuestions };
            });
            
            toast({
                title: "Câu hỏi đã được trả lời",
                description: "Người bán đã trả lời câu hỏi"
            });
        });
        
        setSocket(newSocket);
        
        return () => {
            console.log('🔌 Disconnecting socket');
            if (newSocket) {
                newSocket.emit('leave-product', parseInt(id));
                newSocket.disconnect();
            }
        };
    }, [id, product?.id]);
    
    if (!id) {
        return <div>Không tìm thấy sản phẩm</div>;
    }
    
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">Đang tải...</div>
                </div>
            </div>
        );
    }
    
    if (error || !product) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-red-500">{error || 'Không tìm thấy sản phẩm'}</div>
                </div>
            </div>
        );
    }
    
    const currentPrice = parseFloat(product.current_price as any);
    const buyNowPrice = product.buy_now_price ? parseFloat(product.buy_now_price as any) : null;
    const bidStep = parseFloat(product.bid_step as any);
    
    // Calculate real-time seconds remaining with GMT+7
    const endTimeUTC = new Date(product.end_time);
    const endTime = new Date(endTimeUTC.getTime() + 7 * 60 * 60000); // GMT+7
    const secondsRemaining = Math.max(0, Math.floor((endTime.getTime() - currentTime) / 1000));
    
    const suggestedBid = currentPrice + bidStep;

    const handlePlaceBid = async (
        amount: number,
        isAutoBid: boolean
    ): Promise<void> => {
        if (!socket || !socket.connected) {
            throw new Error('Socket not connected. Please refresh the page.');
        }
        
        return new Promise<void>((resolve, reject) => {
            console.log('🎯 Placing bid:', { amount, isAutoBid, productId: id });
            
            // Listen for success/error once
            const onSuccess = (data: any) => {
                console.log('✅ Bid success:', data);
                socket.off('bid-success', onSuccess);
                socket.off('bid-error', onError);
                
                // Update myMaxPrice if this was an auto-bid
                if (isAutoBid && data.autoBid) {
                    setMyMaxPrice(data.autoBid.maxPrice);
                }
                
                resolve();
            };
            
            const onError = (data: any) => {
                console.error('❌ Bid error:', data);
                socket.off('bid-success', onSuccess);
                socket.off('bid-error', onError);
                reject(new Error(data.message || 'Bid failed'));
            };
            
            socket.once('bid-success', onSuccess);
            socket.once('bid-error', onError);
            
            // Emit bid event
            socket.emit('place-bid', {
                productId: parseInt(id!),
                maxPrice: amount
            });
            
            // Timeout after 10s
            setTimeout(() => {
                socket.off('bid-success', onSuccess);
                socket.off('bid-error', onError);
                reject(new Error('Bid timeout'));
            }, 10000);
        });
    };


    const handleAskQuestion = async (question: string): Promise<void> => {
        if (!id) {
            throw new Error('Product ID not found');
        }
        
        try {
            await askQuestion({
                product_id: parseInt(id),
                question: question.trim()
            });
            
            toast({
                title: "Đã gửi câu hỏi!",
                description: "Câu hỏi của bạn đã được gửi đến người bán."
            });
        } catch (err) {
            console.error('❌ Error asking question:', err);
            throw err;
        }
    };
    
    const handleAnswerQuestion = async (answer: string): Promise<void> => {
        if (!selectedQuestion) {
            throw new Error('No question selected');
        }
        
        try {
            await answerQuestion(selectedQuestion.id, answer);
            
            // Update the product questions locally
            if (product) {
                const updatedQuestions = product.questions?.map(q => 
                    q.id === selectedQuestion.id 
                        ? { ...q, answer, answered_at: new Date().toISOString() }
                        : q
                );
                setProduct({ ...product, questions: updatedQuestions });
            }
            
            toast({
                title: "Đã trả lời!",
                description: "Câu trả lời của bạn đã được gửi thành công."
            });
        } catch (err) {
            console.error('❌ Error answering question:', err);
            throw err;
        }
    };
    
    const handleDenyBidder = async (bidderId: number, reason: string): Promise<void> => {
        if (!id) {
            throw new Error('Product ID not found');
        }
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }
            
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
            const response = await fetch(`${API_URL}/seller/products/${id}/deny-bidder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bidder_id: bidderId, reason })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Không thể từ chối người đấu giá');
            }
            
            const result = await response.json();
            
            // Refresh bids and product data
            const [updatedProduct, bidsData] = await Promise.all([
                getProductById(id),
                getProductBids(id)
            ]);
            
            setProduct(updatedProduct);
            setBids(bidsData.data);
            
            toast({
                title: "✅ Đã từ chối người đấu giá",
                description: result.data.price_changed 
                    ? `Giá đã cập nhật từ ${formatPrice(result.data.previous_price)} thành ${formatPrice(result.data.new_price)}`
                    : "Người đấu giá đã bị từ chối"
            });
        } catch (err) {
            console.error('❌ Error denying bidder:', err);
            throw err;
        }
    };
    
    const handleAppendDescription = async (newText: string): Promise<void> => {
        if (!id) {
            throw new Error('Product ID not found');
        }
        
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Vui lòng đăng nhập');
            }
            
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
            const response = await fetch(`${API_URL}/seller/products/${id}/description`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ additional_description: newText })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Không thể cập nhật mô tả');
            }
            
            const result = await response.json();
            
            // Update product description with the new appended version
            if (result.data) {
                setProduct(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        description: result.data.description,
                        description_history: result.data.description_history
                    };
                });
            }
            
            toast({
                title: "Đã cập nhật mô tả",
                description: "Thông tin bổ sung đã được thêm vào mô tả sản phẩm"
            });
        } catch (err) {
            console.error('❌ Error appending description:', err);
            throw err;
        }
    };
    
    const toggleWatchlist = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để thêm vào danh sách theo dõi",
                variant: "destructive"
            });
            return;
        }
        
        if (!id) return;
        
        try {
            if (isFavorited) {
                await removeFromWatchlist(parseInt(id));
                setIsFavorited(false);
                toast({
                    title: "Đã xóa khỏi danh sách theo dõi",
                    description: "Sản phẩm đã được xóa khỏi danh sách theo dõi"
                });
            } else {
                await addToWatchlist(parseInt(id));
                setIsFavorited(true);
                toast({
                    title: "Đã thêm vào danh sách theo dõi",
                    description: "Sản phẩm đã được thêm vào danh sách theo dõi"
                });
            }
        } catch (err) {
            toast({
                title: "Lỗi",
                description: err instanceof Error ? err.message : "Không thể cập nhật danh sách theo dõi",
                variant: "destructive"
            });
        }
    };

    const handleBuyNow = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để mua ngay",
                variant: "destructive"
            });
            return;
        }
        
        if (!id || !buyNowPrice) return;
        
        // Confirm purchase
        const confirmPurchase = window.confirm(
            `Xác nhận mua sản phẩm với giá ${formatPrice(buyNowPrice)}?\n\nSau khi mua, bạn sẽ được chuyển đến trang thanh toán.`
        );
        
        if (!confirmPurchase) return;
        
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
            const response = await fetch(`${API_URL}/bidder/buy-now/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to buy now');
            }
            
            const result = await response.json();
            
            toast({
                title: "Mua thành công!",
                description: `Đang chuyển đến trang thanh toán...`,
                duration: 2000
            });
            
            // Redirect to checkout page after 1.5 seconds
            setTimeout(() => {
                if (result.data?.order?.id) {
                    window.location.href = `/checkout/${result.data.order.id}`;
                } else {
                    // Fallback to dashboard won tab
                    window.location.href = '/dashboard?tab=won';
                }
            }, 1500);
            
        } catch (err) {
            toast({
                title: "Lỗi",
                description: err instanceof Error ? err.message : "Không thể mua sản phẩm",
                variant: "destructive"
            });
        }
    };


    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Image Gallery */}
                    <div className="lg:col-span-2">
                        <div className="space-y-4">
                            <div className="bg-muted rounded-lg overflow-hidden">
                                <img
                                    src={product.images?.[currentImageIndex]?.url || getImageUrl(product.main_image)}
                                    alt={product.title}
                                    className="w-full h-96 object-cover"
                                />
                            </div>
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-2">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${currentImageIndex === idx ? "border-primary" : "border-border"}`}
                                        >
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Info & Bidding */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <div className="space-y-4">
                                <h1 className="text-2xl font-bold">{product.title}</h1>

                                {isWinning && (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                            🏆 Bạn đang đặt giá cao nhất!
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-2 pb-4 border-b border-border">
                                    <p className="text-sm text-muted-foreground">Giá hiện tại</p>
                                    <p className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</p>
                                    <p className="text-sm text-muted-foreground">{product.total_bids} lượt đặt giá</p>
                                </div>

                                {myMaxPrice && secondsRemaining > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Giá tối đa của bạn</p>
                                        <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{formatPrice(myMaxPrice)}</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Auto-bid đang hoạt động</p>
                                    </div>
                                )}

                                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                                    <p className="text-sm font-semibold text-accent mb-1">Thời gian còn lại</p>
                                    <p className="text-lg font-bold text-foreground">{formatTimeRemaining(secondsRemaining, product.end_time)}</p>
                                </div>

                                {secondsRemaining > 0 && (
                                    <>
                                        <Button className="w-full" size="lg" onClick={() => setShowBidDialog(true)}>
                                            Đặt giá
                                        </Button>

                                        {buyNowPrice && (
                                            <Button 
                                                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                                                size="lg"
                                                onClick={handleBuyNow}
                                            >
                                                Mua ngay - {formatPrice(buyNowPrice)}
                                            </Button>
                                        )}
                                    </>
                                )}

                                {secondsRemaining <= 0 && (
                                    <div className="bg-muted rounded-lg p-4 text-center">
                                        <p className="text-sm font-semibold text-muted-foreground">Đấu giá đã kết thúc</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className={`flex-1 transition-colors ${isFavorited ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-transparent'}`}
                                        onClick={toggleWatchlist}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
                                    </Button>
                                    <Button variant="outline" size="lg" className="flex-1 bg-transparent">
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                    <Button variant="outline" size="lg" className="flex-1 bg-transparent">
                                        <Flag className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Seller Info */}
                        <Card className="p-6">
                            <h3 className="font-semibold mb-4">Thông tin người bán</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{product.seller_name}</p>
                                    {(() => {
                                        const rating = (parseFloat(product.seller_rating as any) * 100);
                                        let bgColor = 'bg-gray-100 dark:bg-gray-800';
                                        let textColor = 'text-gray-600 dark:text-gray-400';
                                        
                                        if (rating >= 80) {
                                            bgColor = 'bg-green-100 dark:bg-green-900/30';
                                            textColor = 'text-green-700 dark:text-green-400';
                                        } else if (rating >= 60) {
                                            bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                                            textColor = 'text-blue-700 dark:text-blue-400';
                                        } else if (rating >= 40) {
                                            bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                                            textColor = 'text-yellow-700 dark:text-yellow-400';
                                        } else if (rating >= 20) {
                                            bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                                            textColor = 'text-orange-700 dark:text-orange-400';
                                        } else {
                                            bgColor = 'bg-red-100 dark:bg-red-900/30';
                                            textColor = 'text-red-700 dark:text-red-400';
                                        }
                                        
                                        return (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${bgColor} ${textColor} rounded-full text-xs font-medium`}>
                                                {rating.toFixed(0)}%
                                            </span>
                                        );
                                    })()}
                                </div>
                                {!isSeller && (
                                    <Button
                                        variant="outline"
                                        className="w-full bg-transparent"
                                        size="sm"
                                        onClick={() => setShowQuestionDialog(true)}
                                    >
                                        Liên hệ người bán
                                    </Button>
                                )}
                            </div>
                        </Card>

                        {/* Top Bidder */}
                        {product.winner_name && (
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Người đặt giá cao nhất</h3>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-semibold">{product.winner_name}</p>
                                    {product.winner_rating && (() => {
                                        const rating = (parseFloat(product.winner_rating as any) * 100);
                                        let bgColor = 'bg-gray-100 dark:bg-gray-800';
                                        let textColor = 'text-gray-600 dark:text-gray-400';
                                        
                                        if (rating >= 80) {
                                            bgColor = 'bg-green-100 dark:bg-green-900/30';
                                            textColor = 'text-green-700 dark:text-green-400';
                                        } else if (rating >= 60) {
                                            bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                                            textColor = 'text-blue-700 dark:text-blue-400';
                                        } else if (rating >= 40) {
                                            bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                                            textColor = 'text-yellow-700 dark:text-yellow-400';
                                        } else if (rating >= 20) {
                                            bgColor = 'bg-orange-100 dark:bg-orange-900/30';
                                            textColor = 'text-orange-700 dark:text-orange-400';
                                        } else {
                                            bgColor = 'bg-red-100 dark:bg-red-900/30';
                                            textColor = 'text-red-700 dark:text-red-400';
                                        }
                                        
                                        return (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${bgColor} ${textColor} rounded-full text-xs font-medium`}>
                                                {rating.toFixed(0)}%
                                            </span>
                                        );
                                    })()}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-12">
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="description">Mô tả</TabsTrigger>
                            <TabsTrigger value="bidding">Lịch sử đặt giá</TabsTrigger>
                            <TabsTrigger value="questions">Câu hỏi</TabsTrigger>
                        </TabsList>

                        <TabsContent value="description" className="mt-6">
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">Mô tả sản phẩm</h3>
                                    {isSeller && (
                                        <AppendDescriptionDialog
                                            productId={parseInt(id!)}
                                            onAppend={handleAppendDescription}
                                            isSeller={isSeller}
                                        />
                                    )}
                                </div>
                                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                                
                                {product.description_history && product.description_history.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h4 className="font-semibold text-sm mb-3">Lịch sử chỉnh sửa</h4>
                                        <div className="space-y-3">
                                            {product.description_history.map((history: any, index: number) => (
                                                <div key={index} className="bg-muted/50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-medium text-primary">
                                                            ✏️ {new Date(history.created_at).toLocaleDateString('vi-VN', {
                                                                year: 'numeric',
                                                                month: '2-digit',
                                                                day: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                        {history.additional_description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Ngày đăng</p>
                                        <p className="font-semibold">{new Date(product.created_at).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Kết thúc</p>
                                                                                <p className="font-semibold">{
                                                                                    (() => {
                                                                                        const d = new Date(product.end_time);
                                                                                        // Lấy giờ UTC + 7
                                                                                        const gmt7 = new Date(d.getTime() + 7 * 60 * 60000);
                                                                                        return gmt7.toLocaleString('vi-VN', { hour12: false });
                                                                                    })()
                                                                                }</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Danh mục</p>
                                        <p className="font-semibold">{product.category_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Bước giá</p>
                                        <p className="font-semibold">{formatPrice(bidStep)}</p>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="bidding" className="mt-6">
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Lịch sử đặt giá</h3>
                                <div className="space-y-3">
                                    {bids.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">Chưa có lượt đặt giá nào</p>
                                    ) : (
                                        bids.map((bid) => {
                                            if (isSeller) {
                                                console.log('[DEBUG] isSeller:', isSeller, 'product.status:', product.status, 'bid.user_id:', (bid as any).user_id, 'bid:', bid);
                                            }
                                            const isDenied = (bid as any).is_denied;
                                            return (
                                                <div key={bid.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg ${isDenied ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`font-semibold ${isDenied ? 'line-through text-muted-foreground' : ''}`}>{bid.masked_bidder_name}</span>
                                                            {bid.is_auto && (
                                                                <Badge variant="secondary" className="text-xs">Auto</Badge>
                                                            )}
                                                            {isDenied && (
                                                                <Badge variant="destructive" className="text-xs">🚫 Đã bị từ chối</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(bid.created_at).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right flex items-center gap-2">
                                                        <div>
                                                            <p className={`font-bold ${isDenied ? 'text-muted-foreground line-through' : 'text-primary'}`}>{formatPrice(parseFloat(bid.bid_price as any))}</p>
                                                        </div>
                                                        {isSeller && product.status === 'active' && (bid as any).user_id && !isDenied && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedBidder({
                                                                        id: (bid as any).user_id,
                                                                        name: bid.masked_bidder_name || 'Unknown'
                                                                    });
                                                                    setShowDenyDialog(true);
                                                                }}
                                                            >
                                                                Từ chối
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="questions" className="mt-6">
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">Câu hỏi về sản phẩm</h3>
                                    {!isSeller && (
                                        <Button size="sm" onClick={() => setShowQuestionDialog(true)}>
                                            Đặt câu hỏi
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {!product.questions || product.questions.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">Chưa có câu hỏi nào</p>
                                    ) : (
                                        product.questions.map((q) => (
                                            <div key={q.id} className="border-b border-border pb-4 last:border-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-semibold text-sm">{q.question}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={q.answer ? "default" : "outline"} className="text-xs">
                                                            {q.answer ? "Đã trả lời" : "Chưa trả lời"}
                                                        </Badge>
                                                        {isSeller && !q.answer && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedQuestion({
                                                                        id: q.id,
                                                                        question: q.question,
                                                                        asker_name: q.asker_name
                                                                    });
                                                                    setShowAnswerDialog(true);
                                                                }}
                                                            >
                                                                Trả lời
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Hỏi bởi {q.asker_name} - {new Date(q.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                                {q.answer && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-muted-foreground mb-1">Câu trả lời:</p>
                                                        <p className="text-sm bg-muted/50 rounded p-3">
                                                            {q.answer}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Related Products */}
                {product.related_products && product.related_products.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {product.related_products.map((item) => (
                                <Link key={item.id} to={`/product/${item.id}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                                        <div className="h-48 bg-muted">
                                            <img
                                                src={getImageUrl(item.main_image)}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                                            <p className="text-primary font-bold">{formatPrice(parseFloat(item.current_price as any))}</p>
                                            <p className="text-xs text-muted-foreground">{item.total_bids} bids</p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <BidDialog
                isOpen={showBidDialog}
                onClose={() => setShowBidDialog(false)}
                currentBid={currentPrice}
                minIncrement={bidStep}
                suggestedBid={suggestedBid}
                onPlaceBid={handlePlaceBid}
            />

            <AskQuestionDialog
                isOpen={showQuestionDialog}
                onClose={() => setShowQuestionDialog(false)}
                sellerName={product.seller_name}
                onAsk={handleAskQuestion}
            />

            {selectedQuestion && (
                <AnswerQuestionDialog
                    isOpen={showAnswerDialog}
                    onClose={() => {
                        setShowAnswerDialog(false);
                        setSelectedQuestion(null);
                    }}
                    question={selectedQuestion}
                    onAnswer={handleAnswerQuestion}
                />
            )}

            {selectedBidder && (
                <DenyBidderDialog
                    isOpen={showDenyDialog}
                    onClose={() => {
                        setShowDenyDialog(false);
                        setSelectedBidder(null);
                    }}
                    bidderName={selectedBidder.name}
                    bidderId={selectedBidder.id}
                    productId={parseInt(id!)}
                    onDeny={handleDenyBidder}
                />
            )}
        </div>
    )
}
