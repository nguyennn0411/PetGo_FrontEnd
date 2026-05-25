import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ShopLayout from '../../components/shop/ShopLayout';
import ProductCard from '../../components/shop/ProductCard';
import { getCurrentUserId, shopApi } from '../../api/shop';

export default function ShopCatalogPage() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState(params.get('keyword') || '');
  const [categoryId, setCategoryId] = useState(params.get('categoryId') || '');
  const [species, setSpecies] = useState(params.get('species') || '');
  const [sort, setSort] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await shopApi.getProducts({ keyword, categoryId, species });
      setProducts(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được sản phẩm từ API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { shopApi.getCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => { loadProducts(); }, [categoryId, species]);

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    if (sort === 'price-asc') copy.sort((a, b) => Number(a.salePriceAmount || a.priceAmount || 0) - Number(b.salePriceAmount || b.priceAmount || 0));
    if (sort === 'price-desc') copy.sort((a, b) => Number(b.salePriceAmount || b.priceAmount || 0) - Number(a.salePriceAmount || a.priceAmount || 0));
    if (sort === 'rating') copy.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
    return copy;
  }, [products, sort]);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (keyword) next.keyword = keyword;
    if (categoryId) next.categoryId = categoryId;
    if (species) next.species = species;
    setParams(next);
    loadProducts();
  };

  const addToCart = async (product) => {
    await shopApi.addCartItem({ userId: getCurrentUserId(), productId: product.id, quantity: 1 });
    alert('Đã thêm vào giỏ hàng!');
  };

  return (
    <ShopLayout>
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="text-sm font-black text-orange-600 uppercase tracking-widest">PetGo Store</div>
          <h1 className="text-4xl font-black tracking-tight text-gray-950 mt-2">Tất cả sản phẩm</h1>
          <p className="text-gray-500 font-medium mt-2">Danh sách lấy từ backend Spring Boot và bảng products trong MySQL.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-72 shrink-0 bg-white rounded-[2rem] border border-orange-100 p-6 h-max sticky top-24">
            <div className="flex items-center gap-2 font-black text-gray-900 mb-6"><SlidersHorizontal className="w-5 h-5 text-orange-500" /> Bộ lọc</div>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Danh mục</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-2xl border border-gray-200 p-3 font-bold outline-none focus:border-orange-400">
                  <option value="">Tất cả</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Loài thú cưng</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['', 'Tất cả'], ['DOG', 'Chó'], ['CAT', 'Mèo'], ['ALL', 'Chung']].map(([value, label]) => (
                    <button key={value} onClick={() => setSpecies(value)} className={`py-3 rounded-2xl border font-black text-sm ${species === value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1 space-y-5">
            <form onSubmit={submit} className="bg-white rounded-[2rem] border border-orange-100 p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full bg-gray-50 rounded-2xl pl-11 pr-4 py-3 outline-none font-bold" />
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-2xl border border-gray-200 px-4 py-3 font-bold outline-none">
                <option value="default">Sắp xếp mặc định</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="rating">Đánh giá cao</option>
              </select>
              <button className="bg-gray-900 hover:bg-orange-500 text-white px-7 py-3 rounded-2xl font-black uppercase tracking-widest text-xs">Tìm</button>
            </form>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl font-bold">{error}</div>}
            <div className="text-sm font-bold text-gray-500">Tìm thấy <span className="text-orange-600">{sortedProducts.length}</span> sản phẩm</div>
            {loading ? <div className="text-center py-20 font-black text-gray-400">Đang tải...</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedProducts.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
              </div>
            )}
          </section>
        </div>
      </main>
    </ShopLayout>
  );
}
