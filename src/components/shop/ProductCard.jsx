import React from 'react';
import { Heart, ShoppingBasket, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatVnd, resolveProductPrice } from '../../api/shop';

export default function ProductCard({ product, onAdd }) {
  const price = resolveProductPrice(product);
  const sale = product.salePriceAmount && Number(product.salePriceAmount) < Number(product.priceAmount);
  return (
    <div className="group bg-white border border-orange-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-orange-100/70 hover:-translate-y-1 transition-all">
      <Link to={`/shop/product/${product.slug}`} className="block relative h-56 bg-orange-50 overflow-hidden">
        <img src={product.mainImageUrl || product.imageUrl || 'https://placehold.co/600x400/FFF5F0/FF8A5B?text=PetGo'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {sale && <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">Sale</span>}
        {product.hot && <span className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">Hot</span>}
      </Link>
      <div className="p-5 space-y-3">
        <div className="flex justify-between gap-3">
          <Link to={`/shop/product/${product.slug}`} className="font-black text-gray-900 leading-snug hover:text-orange-600 line-clamp-2">{product.name}</Link>
          <button className="w-9 h-9 shrink-0 rounded-full bg-gray-50 hover:bg-pink-50 text-gray-400 hover:text-pink-500 flex items-center justify-center"><Heart className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
          <Star className="w-4 h-4 fill-current" /> {Number(product.averageRating || 0).toFixed(1)}
          <span className="text-gray-400">({product.totalReviews || 0})</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-orange-600 text-xl font-black">{formatVnd(price)}</div>
            {sale && <div className="text-gray-400 text-xs line-through font-bold">{formatVnd(product.priceAmount)}</div>}
          </div>
          <button onClick={() => onAdd?.(product)} className="bg-gray-900 hover:bg-orange-500 text-white p-3 rounded-2xl transition-colors" title="Thêm vào giỏ">
            <ShoppingBasket className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
