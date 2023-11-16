import { useContext } from 'react';
import { StepperContext } from '../components/stepper';

export function useStepper() {
	const context = useContext(StepperContext);

	if (!context) {
		throw new Error('useStepper must be used within a Stepper');
	}

	return context;
}
