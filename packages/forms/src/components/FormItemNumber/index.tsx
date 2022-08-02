import React from 'react'
import { FormItem, FormItemType } from '../../types'

export default function FormItemNumber({
  item,
  onChange,
  className = '',
  overlapLabel = false,
}: {
  item: Extract<FormItem, { type: FormItemType.Number }>
  onChange: (number: number) => void
  className?: string
  overlapLabel?: boolean
}) {
  return (
    <div className={className}>
      {item.contextLabel && (
        <div className="h-8 mb-1 flex items-center">
          <div className="w-1 bg-gray-300 rounded-full h-8 mr-2" />
          <span className="text-gray-500">{item.contextLabel}</span>
        </div>
      )}

      <div className="relative">
        <label
          htmlFor={item.id}
          className={`block font-medium text-gray-700 ${
            overlapLabel
              ? 'absolute -top-2 left-2 -mt-px px-1 bg-white border border-gray-300 h-2.5 border-b-transparent rounded-t-md text-xs'
              : 'text-sm'
          }`}
        >
          {item.label}
        </label>
        <div className={`${overlapLabel ? 'mt-3' : 'mt-1'}`}>
          <input
            type="number"
            name={item.id}
            id={item.id}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={item.value ?? 0}
            onChange={(e) => onChange(e.target.valueAsNumber)}
            min={item.minValue}
            max={item.maxValue}
          />
        </div>
      </div>
    </div>
  )
}
