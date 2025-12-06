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
import { useParams, Link } from "react-router-dom"
import { getProductById, getProductBids, formatPrice, formatTimeRemaining, getImageUrl, type Product, type Bid } from "@/lib/products"
import { io, Socket } from "socket.io-client"
import { useToast } from "@/components/ui/use-toast"

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    
    const [product, setProduct] = useState<Product | null>(null)
    const [bids, setBids] = useState<Bid[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isFavorited, setIsFavorited] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showBidDialog, setShowBidDialog] = useState(false)
    const [showQuestionDialog, setShowQuestionDialog] = useState(false)
    const [socket, setSocket] = useState<Socket | null>(null)

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
                title: "New Bid!",
                description: `${data.bidder.name} bid ${formatPrice(data.currentPrice)}${data.isAutoBid ? ' (Auto)' : ''}`,
            });
        });
        
        newSocket.on('auction-extended', (data: any) => {
            console.log('⏰ Auction extended:', data);
            setProduct(prev => {
                if (!prev) return prev;
                return { ...prev, end_time: data.newEndTime };
            });
            
            toast({
                title: "⏰ Auction Extended",
                description: `Extended by ${data.extendedMinutes} minutes due to last-minute bid`,
            });
        });
        
        newSocket.on('auction-ended', (data: any) => {
            console.log('🏁 Auction ended:', data);
            setProduct(prev => {
                if (!prev) return prev;
                return { ...prev, status: 'ended' };
            });
            
            toast({
                title: "🏁 Auction Ended",
                description: `Final price: ${formatPrice(data.finalPrice)}`,
            });
        });
        
        newSocket.on('outbid', (data: any) => {
            console.log('⚠️ You were outbid:', data);
            toast({
                title: "⚠️ You were outbid!",
                description: `New price: ${formatPrice(data.newPrice)}`,
                variant: "destructive"
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
        return <div>Product not found</div>;
    }
    
    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }
    
    if (error || !product) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-red-500">{error || 'Product not found'}</div>
                </div>
            </div>
        );
    }
    
    const currentPrice = parseFloat(product.current_price as any);
    const buyNowPrice = product.buy_now_price ? parseFloat(product.buy_now_price as any) : null;
    const bidStep = parseFloat(product.bid_step as any);
    const secondsRemaining = parseFloat(product.seconds_remaining as any);
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
        return new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 1500);
        });
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

                                <div className="space-y-2 pb-4 border-b border-border">
                                    <p className="text-sm text-muted-foreground">Current bid</p>
                                    <p className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</p>
                                    <p className="text-sm text-muted-foreground">{product.total_bids} bids</p>
                                </div>

                                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                                    <p className="text-sm font-semibold text-accent mb-1">Time remaining</p>
                                    <p className="text-lg font-bold text-foreground">{formatTimeRemaining(secondsRemaining)}</p>
                                </div>

                                <Button className="w-full" size="lg" onClick={() => setShowBidDialog(true)}>
                                    Place Bid
                                </Button>

                                {buyNowPrice && (
                                    <Button className="w-full bg-transparent" variant="outline" size="lg">
                                        Buy Now - {formatPrice(buyNowPrice)}
                                    </Button>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 bg-transparent"
                                        onClick={() => setIsFavorited(!isFavorited)}
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
                            <h3 className="font-semibold mb-4">Seller Information</h3>
                            <div className="space-y-2">
                                <p className="font-semibold">{product.seller_name}</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex text-yellow-500">{"★".repeat(Math.floor(parseFloat(product.seller_rating as any)))}</div>
                                    <span className="text-sm text-muted-foreground">
                                        {parseFloat(product.seller_rating as any).toFixed(1)}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full bg-transparent"
                                    size="sm"
                                    onClick={() => setShowQuestionDialog(true)}
                                >
                                    Contact Seller
                                </Button>
                            </div>
                        </Card>

                        {/* Top Bidder */}
                        {product.winner_name && (
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Top Bidder</h3>
                                <div className="space-y-2">
                                    <p className="font-semibold">{product.winner_name}</p>
                                    {product.winner_rating && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-yellow-500">{"★".repeat(Math.floor(parseFloat(product.winner_rating as any)))}</div>
                                            <span className="text-sm text-muted-foreground">
                                                {parseFloat(product.winner_rating as any).toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-12">
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="description">Description</TabsTrigger>
                            <TabsTrigger value="bidding">Bid History</TabsTrigger>
                            <TabsTrigger value="questions">Questions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="description" className="mt-6">
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Product Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                                <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Posted</p>
                                        <p className="font-semibold">{new Date(product.created_at).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Ends</p>
                                        <p className="font-semibold">{new Date(product.end_time).toLocaleString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Category</p>
                                        <p className="font-semibold">{product.category_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Bid Step</p>
                                        <p className="font-semibold">{formatPrice(bidStep)}</p>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="bidding" className="mt-6">
                            <Card className="p-6">
                                <h3 className="font-semibold mb-4">Bidding History</h3>
                                <div className="space-y-3">
                                    {bids.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No bids yet</p>
                                    ) : (
                                        bids.map((bid) => (
                                            <div key={bid.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{bid.masked_bidder_name}</span>
                                                        {bid.is_auto && (
                                                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(bid.created_at).toLocaleString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-primary">{formatPrice(parseFloat(bid.bid_price as any))}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="questions" className="mt-6">
                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">Questions About This Item</h3>
                                    <Button size="sm" onClick={() => setShowQuestionDialog(true)}>
                                        Ask Question
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {!product.questions || product.questions.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">No questions yet</p>
                                    ) : (
                                        product.questions.map((q) => (
                                            <div key={q.id} className="border-b border-border pb-4 last:border-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-semibold text-sm">{q.question}</p>
                                                    <Badge variant={q.answer ? "default" : "outline"} className="text-xs">
                                                        {q.answer ? "Answered" : "Pending"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Asked by {q.asker_name} - {new Date(q.created_at).toLocaleDateString('vi-VN')}
                                                </p>
                                                {q.answer && (
                                                    <p className="text-sm bg-muted/50 rounded p-2 mt-2">
                                                        {q.answer}
                                                    </p>
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
                        <h2 className="text-2xl font-bold mb-6">Related Items</h2>
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
        </div>
    )
}
