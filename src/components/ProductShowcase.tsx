
import { useCart } from "@/contexts/CartContext";
import { Button } from "./ui/button";

const featuredProducts = [
  {
    id: "2",
    name: "Winter Blanket",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
    description: "Handmade with soft merino wool"
  },
];

const ProductShowcase = () => {
  const { addToCart } = useCart();

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-script text-center text-primary-dark mb-12">
          Featured Collection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-8 max-w-2xl mx-auto">
          {featuredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary-dark">
                    ${product.price}
                  </span>
                  <Button
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
