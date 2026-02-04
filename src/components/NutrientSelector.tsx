'use client'

interface NutrientSelectorProps {
  availableNutrients: string[]
  selectedNutrients: string[]
  onChange: (selected: string[]) => void
  maxSelection?: number
}

export function NutrientSelector({
  availableNutrients,
  selectedNutrients,
  onChange,
  maxSelection = 5,
}: NutrientSelectorProps) {
  const toggleNutrient = (nutrient: string) => {
    if (selectedNutrients.includes(nutrient)) {
      onChange(selectedNutrients.filter(n => n !== nutrient))
    } else if (selectedNutrients.length < maxSelection) {
      onChange([...selectedNutrients, nutrient])
    }
  }

  const selectAll = () => {
    onChange(availableNutrients.slice(0, maxSelection))
  }

  const clearAll = () => {
    onChange([])
  }

  // Group nutrients by type
  const vitamins = availableNutrients.filter(n =>
    n.toLowerCase().includes('vitamin') ||
    ['Thiamin', 'Riboflavin', 'Niacin', 'Folate', 'Folic Acid', 'Biotin', 'Choline', 'Cobalamin', 'Pantothenic Acid'].includes(n)
  )
  const minerals = availableNutrients.filter(n =>
    ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Chromium', 'Molybdenum', 'Iodine'].includes(n)
  )
  const other = availableNutrients.filter(n => !vitamins.includes(n) && !minerals.includes(n))

  const renderGroup = (title: string, nutrients: string[]) => {
    if (nutrients.length === 0) return null
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <div className="space-y-1">
          {nutrients.map(nutrient => (
            <label
              key={nutrient}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-50 ${
                selectedNutrients.includes(nutrient) ? 'bg-blue-50' : ''
              } ${selectedNutrients.length >= maxSelection && !selectedNutrients.includes(nutrient) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedNutrients.includes(nutrient)}
                onChange={() => toggleNutrient(nutrient)}
                disabled={selectedNutrients.length >= maxSelection && !selectedNutrients.includes(nutrient)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{nutrient}</span>
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          Select Nutrients ({selectedNutrients.length}/{maxSelection})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {renderGroup('Vitamins', vitamins)}
        {renderGroup('Minerals', minerals)}
        {renderGroup('Other', other)}
      </div>

      {availableNutrients.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No nutrient data available for the selected period.
        </div>
      )}
    </div>
  )
}
