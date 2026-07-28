"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Tag,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WishlistItem {
  id: string;
  name: string;
  price: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  url?: string;
  imageUrl?: string;
  notes?: string;
}

const INITIAL_ITEMS: WishlistItem[] = [
  {
    id: "1",
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: "$399.00",
    category: "Electronics",
    priority: "High",
    url: "https://sony.com",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    notes: "Noise-canceling headphones for deep focus work.",
  },
  {
    id: "2",
    name: "Herman Miller Aeron Ergonomic Chair",
    price: "$1,295.00",
    category: "Furniture",
    priority: "High",
    url: "https://hermanmiller.com",
    imageUrl: "https://images.unsplash.com/photo-1580481072645-022f9a6d1276?auto=format&fit=crop&w=600&q=80",
    notes: "Fully adjustable ergonomic desk chair.",
  },
  {
    id: "3",
    name: "Apple Watch Series 10 Titanium",
    price: "$699.00",
    category: "Wearables",
    priority: "Medium",
    url: "https://apple.com",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    notes: "Fitness and health tracking.",
  },
];

export default function WishlistPage() {
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Electronics");
  const [newItemPriority, setNewItemPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: WishlistItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      price: newItemPrice.trim() || "N/A",
      category: newItemCategory.trim() || "General",
      priority: newItemPriority,
      url: newItemUrl.trim() || undefined,
      imageUrl: newItemImageUrl.trim() || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80",
      notes: newItemNotes.trim() || undefined,
    };

    setItems([newItem, ...items]);

    // Reset Form
    setNewItemName("");
    setNewItemPrice("");
    setNewItemCategory("Electronics");
    setNewItemPriority("Medium");
    setNewItemUrl("");
    setNewItemImageUrl("");
    setNewItemNotes("");
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/" className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Gift className="w-8 h-8 text-primary" />
            <span>My Wishlist & Products</span>
          </h1>
          <p className="text-muted-foreground text-sm pt-1">
            Manage your personal wishlist items and gift registry.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 shadow-sm rounded-full px-5"
          size="default"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-full bg-background border-border/70"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full text-xs"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed rounded-2xl bg-muted/20">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? "Try adjusting your search query or category filter."
              : "Your wishlist is currently empty. Click below to add your first product!"}
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add First Product
          </Button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow group border-border/70">
                  {item.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-muted relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback on broken image
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md text-white ${
                            item.priority === "High"
                              ? "bg-rose-500/90"
                              : item.priority === "Medium"
                              ? "bg-amber-500/90"
                              : "bg-emerald-500/90"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Tag className="w-3 h-3" />
                      <span>{item.category}</span>
                    </div>
                    <CardTitle className="text-base font-bold line-clamp-1">{item.name}</CardTitle>
                    <CardDescription className="text-sm font-semibold text-primary">
                      {item.price}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 flex-1">
                    {item.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-2 border-t flex items-center justify-between gap-2">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>View Store</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Saved item</span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal for adding new product */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <span>Add Product to Wishlist</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. MacBook Pro M3 16-inch"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    placeholder="e.g. $2,499.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g. Electronics"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={newItemPriority}
                  onChange={(e) => setNewItemPriority(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="url">Product Link (URL)</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/product"
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newItemImageUrl}
                  onChange={(e) => setNewItemImageUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Size, color, or reason for wishlist"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add to Wishlist</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
