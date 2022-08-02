import React from 'react'
import { RadioGroup } from '@headlessui/react'
import { FormItem, SelectOption, FormItemType } from '../../types'

export default function FormItemSelect({
  item,
  onSelect,
  buildLabel = (option: SelectOption) => option.label,
  disabled = false,
  hideContextLabel = false,
  hideLabel = false,
  className = '',
}: {
  item: FormItem<FormItemType.Select>
  onSelect?: (option: SelectOption) => void
  hideLabel?: boolean
  hideContextLabel?: boolean
  disabled?: boolean
  buildLabel?: (option: SelectOption) => string | JSX.Element
  className?: string
}) {
  return (
    <div className={className}>
      {item.contextLabel && !hideContextLabel && (
        <div className="h-8 mb-1 flex items-center">
          <div className="w-1 bg-gray-300 rounded-full h-8 mr-2" />
          <span className="text-gray-500">{item.contextLabel}</span>
        </div>
      )}
      {!hideLabel && (
        <div className="h-8 flex items-center mb-6">
          <span className="text-xl">{item.label}</span>
        </div>
      )}
      <RadioGroup
        disabled={disabled}
        value={item.value?.label}
        onChange={(newLabel: string | undefined) => {
          const selected = item.options.find((o) => o.label === newLabel)
          selected && onSelect && onSelect(selected)
        }}
      >
        <RadioGroup.Label className="sr-only">{item.label}</RadioGroup.Label>
        <div className="bg-white rounded-md -space-y-px">
          {item.options.map((option, optionIdx) => (
            <RadioGroup.Option
              key={option.label}
              value={option.label}
              className={({ checked }) =>
                `${optionIdx === 0 ? 'rounded-tl-md rounded-tr-md' : ''} ${
                  optionIdx === item.options.length - 1
                    ? 'rounded-bl-md rounded-br-md'
                    : ''
                } ${
                  checked
                    ? 'bg-indigo-50 border-indigo-200 z-10'
                    : 'border-gray-200'
                } relative border p-4 flex cursor-pointer focus:outline-none`
              }
            >
              {({ active, checked }) => (
                <>
                  <span
                    className={`${
                      checked
                        ? 'bg-indigo-600 border-transparent'
                        : 'bg-white border-gray-300'
                    } ${
                      active ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                    } h-4 w-4 mt-0.5 cursor-pointer rounded-full border items-center justify-center shrink-0`}
                    aria-hidden="true"
                  >
                    <span className="rounded-full bg-white w-1.5 h-1.5" />
                  </span>
                  <RadioGroup.Label
                    as="span"
                    className={`${
                      checked
                        ? 'text-indigo-900'
                        : item.value !== null
                        ? 'text-gray-500'
                        : 'text-gray-900'
                    } block text-sm font-medium ml-3`}
                  >
                    {buildLabel(option)}
                  </RadioGroup.Label>
                </>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}
