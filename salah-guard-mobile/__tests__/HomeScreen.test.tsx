import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

// Mock store
jest.mock('../src/store/useSalahStore', () => {
  const mockPrayers = [
    {
      id: 1,
      name: 'Fajr',
      arabicName: 'فجر',
      scheduledTime: '05:00',
      durationMinutes: 15,
      isEnabled: true,
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      id: 2,
      name: 'Dhuhr',
      arabicName: 'ظهر',
      scheduledTime: '13:00',
      durationMinutes: 20,
      isEnabled: true,
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
  ];

  return {
    __esModule: true,
    default: jest.fn((selector: (state: Record<string, unknown>) => unknown) => {
      const state = {
        prayers: mockPrayers,
        settings: { isGloballyActive: true },
        isLoading: false,
        isOffline: false,
        loadPrayers: jest.fn().mockResolvedValue(undefined),
        loadSettings: jest.fn().mockResolvedValue(undefined),
      };
      return selector(state);
    }),
  };
});

describe('HomeScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('displays prayer cards', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Fajr')).toBeTruthy();
    expect(getByText('Dhuhr')).toBeTruthy();
  });

  it('shows the master toggle', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('master-toggle')).toBeTruthy();
  });
});
