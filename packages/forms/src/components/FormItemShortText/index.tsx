import React from 'react'
import { FormItem, FormItemType, FormValue } from '../../types'

export default function FormItemShortText({
  item,
  value,
  onChange,
  className = '',
  overlapLabel = false,
}: {
  item: FormItem<FormItemType.ShortText>
  value: FormValue<FormItemType.ShortText>
  onChange: (text: FormValue<FormItemType.ShortText>) => void
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
            type="text"
            name={item.id}
            id={item.id}
            minLength={item.minLength}
            maxLength={item.maxLength}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder={item.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
