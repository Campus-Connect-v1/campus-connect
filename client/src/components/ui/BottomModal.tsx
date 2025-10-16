import React, { forwardRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetProps,
} from '@gorhom/bottom-sheet';

type BottomModalProps = {
  children: React.ReactNode;
  snapPoints: BottomSheetProps['snapPoints'];
  state: boolean;
  onChange?: (index: number) => void;
};

const BottomModal = forwardRef<BottomSheet, BottomModalProps>(
  ({ children, snapPoints, state, onChange, ...props }, ref) => {
    // Memoize snap points to prevent unnecessary re-renders
    const snapPointsMemo = useMemo(() => snapPoints, [snapPoints]);

    return (
      <BottomSheet
        ref={ref}
        index={state ? 0 : -1}
        snapPoints={snapPointsMemo}
        enablePanDownToClose={true}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
        enableOverDrag={false}
        onChange={onChange}
        {...props}
      >
        <BottomSheetView className={'bg-lightCream'} style={styles.container}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    height: 450,
  },
  background: {
    backgroundColor: '#FBFCFE', // lightCream color
  },
  indicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
    height: 4,
  },
});

BottomModal.displayName = 'BottomModal';

export default BottomModal;
