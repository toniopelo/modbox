import { useState } from 'react'

import {
  FormItem,
  FormItemType,
  Response,
  StepIdentifiers,
  SteppedFormItem,
  StepsDefinition,
  UseFormReturnBase,
  UseFormReturnWithSteps,
} from './types'
import { validateItem } from './validators'

export const MAX_SIZE_RESOLUTION = 12

const filterByStep = <
  StepsID extends StepIdentifiers,
  FTypes extends FormItemType,
>(
  items: SteppedFormItem<StepsID, FTypes>[],
  step: StepsID,
) => {
  return items.filter((i) => i.step === step)
}
const stepId = <StepsDef extends StepsDefinition>(
  step: StepsDef[number],
): StepIdentifiers<StepsDef> => {
  return typeof step === 'string' || typeof step === 'number'
    ? (step as StepIdentifiers<StepsDef>)
    : (step.id as StepIdentifiers<StepsDef>)
}

const stepClassName = (step: StepsDefinition[number]): string => {
  return typeof step === 'string' || typeof step === 'number'
    ? ''
    : step.className ?? ''
}

const updateResponse = <FTypes extends FormItemType>(
  itemsSet: FormItem<FTypes>[],
  item: FormItem<FTypes>,
  response: Response<FTypes>,
): FormItem<FTypes>[] => {
  const idx = itemsSet.findIndex((i) => i.id === item.id)
  if (idx === -1) {
    return itemsSet
  }

  const updated = [
    ...itemsSet.slice(0, idx),
    {
      ...itemsSet[idx],
      value: response,
    },
    ...itemsSet.slice(idx + 1),
  ]

  return updated
}

export const useSteppedForm = <StepsDef extends StepsDefinition>({
  steps: initialStepsDef,
  items: initialItems,
  clearItems,
  startOnStep,
  onChange,
  onNext,
  onPrev,
}: {
  steps: StepsDef
  startOnStep?: StepIdentifiers<StepsDef>
  items: SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[]
  clearItems?: (
    itemsToClear: SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[],
  ) => SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[]
  onChange?: (
    items: SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[],
    stepItems: SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[],
  ) => void
  onNext?: (step: StepIdentifiers<StepsDef>) => void
  onPrev?: (step: StepIdentifiers<StepsDef>) => void
}): UseFormReturnWithSteps<StepsDef> => {
  const [stepsDef] = useState<StepsDef>(initialStepsDef)
  const [items, setItems] = useState(initialItems)

  const [currentStep, setCurrentStep] = useState<StepIdentifiers<StepsDef>>(
    startOnStep ?? stepId<StepsDef>(stepsDef[0]),
  )
  const updateItems = (
    items: SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[],
  ) => {
    setItems(items)
    onChange && onChange(items, filterByStep(items, currentStep))
  }
  const clearItemsFn =
    clearItems ??
    ((itemsToClear) =>
      initialItems.filter(
        (i) => !!itemsToClear.find((toClear) => toClear.id === i.id),
      ))

  const stepItems = filterByStep(items, currentStep)
  const isLastStep = currentStep === stepId(stepsDef[stepsDef.length - 1])
  const isFirstStep = currentStep === stepId(stepsDef[0])
  const currentStepIdx = stepsDef.findIndex((s) => stepId(s) === currentStep)

  // Validation
  const isStepValid = stepItems.every((i) => validateItem(i))
  const {
    completedSteps,
    inProgressStep = stepId<StepsDef>(stepsDef[stepsDef.length - 1]),
    isFormValid,
  } = stepsDef.reduce<{
    completedSteps: StepIdentifiers<StepsDef>[]
    inProgressStep: StepIdentifiers<StepsDef> | undefined
    isFormValid: boolean
  }>(
    (acc, stepDef) => {
      const isValid = filterByStep(items, stepId(stepDef)).every((i) =>
        validateItem(i),
      )
      return {
        completedSteps: isValid
          ? [...acc.completedSteps, stepId(stepDef)]
          : acc.completedSteps,
        inProgressStep:
          !isValid && acc.inProgressStep === undefined
            ? stepId<StepsDef>(stepDef)
            : acc.inProgressStep,
        isFormValid: isValid && acc.isFormValid,
      }
    },
    {
      completedSteps: [],
      inProgressStep: undefined,
      isFormValid: true,
    },
  )

  const next = () => {
    if (!isLastStep && isStepValid) {
      const nextStep = stepId<StepsDef>(stepsDef[currentStepIdx + 1])
      setCurrentStep(nextStep)
      onNext && onNext(nextStep)
    }
  }
  const prev = () => {
    if (!isFirstStep) {
      const prevStep = stepId<StepsDef>(stepsDef[currentStepIdx - 1])
      setCurrentStep(prevStep)
      onPrev && onPrev(prevStep)
    }
  }

  return {
    items,
    stepItems,
    currentStep,
    currentStepIdx,
    stepClassName: stepClassName(stepsDef[currentStepIdx]),
    isFirstStep,
    isLastStep,
    completedSteps,
    inProgressStep,
    setCurrentStep: (step: StepIdentifiers<StepsDef>) => setCurrentStep(step),
    next,
    prev,
    isStepValid,
    isValid: isFormValid,
    clearAll: () => updateItems(clearItemsFn(items)),
    clearStep: () =>
      updateItems(
        clearItemsFn(stepItems).reduce((acc, i) => {
          return i.type !== FormItemType.Heading &&
            i.type !== FormItemType.Custom
            ? (updateResponse(acc, i, i.value) as SteppedFormItem<
                StepIdentifiers<StepsDef>
              >[])
            : acc
        }, items),
      ),
    updateResponse: <FType extends FormItemType>(
      item: FormItem<FType>,
      response: Response<FType>,
    ) =>
      updateItems(
        updateResponse(items, item, response) as SteppedFormItem<
          StepIdentifiers<StepsDef>
        >[],
      ),
  }
}

export const useForm = ({
  items: initialItems,
  onChange,
  clearItems,
}: {
  items: FormItem<FormItemType>[]
  onChange: (items: FormItem<FormItemType>[]) => void
  clearItems?: (
    itemsToClear: FormItem<FormItemType>[],
  ) => FormItem<FormItemType>[]
}): UseFormReturnBase => {
  const [items, setItems] = useState(initialItems)
  const isValid = items.every((i) => validateItem(i))
  const updateItems = (items: FormItem<FormItemType>[]) => {
    setItems(items)
    onChange && onChange(items)
  }
  const clearItemsFn = clearItems ?? (() => initialItems)

  return {
    items,
    isValid,
    clearAll: () => updateItems(clearItemsFn(items)),
    updateResponse: <FType extends FormItemType>(
      item: FormItem<FType>,
      response: Response<FType>,
    ) => {
      updateItems(updateResponse(items, item, response))
    },
  }
}
