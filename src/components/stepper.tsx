import { Children, PropsWithChildren, createContext, useMemo, useState } from 'react';

type StepperValues = {
	nextStep: () => void;
	previousStep: () => void;
};
export const StepperContext = createContext<StepperValues | null>(null);

type StepperProps = {
	startIndex?: number;
};

export function Stepper({ startIndex = 0, children }: PropsWithChildren<StepperProps>) {
	const [activeStep, setActiveStep] = useState(startIndex);

	const stepperValue = {
		nextStep: () => setActiveStep((prev) => prev + 1),
		previousStep: () => setActiveStep((prev) => prev - 1)
	};

	const stepContent = useMemo(() => {
		const reactChildren = Children.toArray(children);

		if (!reactChildren.length) {
			console.warn('Make sure to pass your steps as children in your <Stepper>');
		}

		return reactChildren[activeStep];
	}, [activeStep, children]);

	return <StepperContext.Provider value={stepperValue}>{stepContent}</StepperContext.Provider>;
}
