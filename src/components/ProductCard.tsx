'use client'

import { ProductData } from '@/types'

interface ProductCardProps {
  product: ProductData & { id?: string }
  onAdd?: (productId: string, quantity: number) => void
  onRemove?: (productId: string) => void
  showActions?: boolean
  compact?: boolean
}

export function ProductCard({
  product,
  onAdd,
  onRemove,
  showActions = true,
  compact = false
}: ProductCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex gap-4">
        {product.imageUrl && !compact && (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-16 h-16 object-contain rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : ''}`}>
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-sm text-gray-500">{product.brand}</p>
          )}
          {product.servingSize && (
            <p className="text-xs text-gray-400">
              Serving: {product.servingSize} {product.servingUnit}
            </p>
          )}
          {!compact && product.nutrients && product.nutrients.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.nutrients.slice(0, 5).map(n => (
                <span
                  key={n.name}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                >
                  {n.name}
                </span>
              ))}
              {product.nutrients.length > 5 && (
                <span className="text-xs text-gray-400">
                  +{product.nutrients.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
        {showActions && product.id && (
          <div className="flex flex-col gap-2">
            {onAdd && (
              <button
                onClick={() => onAdd(product.id!, 1)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                + Log
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(product.id!)}
                className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
