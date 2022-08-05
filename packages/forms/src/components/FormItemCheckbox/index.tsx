import React from 'react'
import { FormItem, FormItemType, FormValue } from '../../types'

export default function FormItemCheckbox({
  item,
  value,
  onChange,
  className = '',
}: {
  item: FormItem<FormItemType.Checkbox>
  value: FormValue<FormItemType.Checkbox>
  onChange: (checked: FormValue<FormItemType.Checkbox>) => void
  className?: string
}) {
  return (
    <div className={className}>
      {item.contextLabel && (
        <div className="h-8 mb-1 flex items-center">
          <div className="w-1 bg-gray-300 rounded-full h-8 mr-2" />
          <span className="text-gray-500">{item.contextLabel}</span>
        </div>
      )}

      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id={item.id}
            name={item.id}
            type="checkbox"
            checked={value}
            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            onChange={(e) => onChange(e.target.checked)}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={item.id} className="font-medium text-gray-700">
            {item.label}
          </label>
        </div>
      </div>
    </div>
  )
}
