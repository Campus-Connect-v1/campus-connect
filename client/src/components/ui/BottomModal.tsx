import BottomSheet, { BottomSheetView, type BottomSheetProps } from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo } from "react";

import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

type BottomModalProps = {
  children: React.ReactNode;
  snapPoints: BottomSheetProps["snapPoints"];
  state: boolean;
  onChange?: (index: number) => void;
};

const BottomModal = forwardRef<BottomSheet, BottomModalProps>(
  ({ children, snapPoints, state, onChange, ...props }, ref) => {
    const { colors } = useTheme();
    const snapPointsMemo = useMemo(() => snapPoints, [snapPoints]);

    return (
      <BottomSheet
        ref={ref}
        index={state ? 0 : -1}
        snapPoints={snapPointsMemo}
        // Dynamic sizing defaults to true in v5 and fights explicit
        // snapPoints — the sheet can end up with an indeterminate frame that
        // still covers (and blocks touches on) the screen while "closed".
        enableDynamicSizing={false}
        enablePanDownToClose
        enableOverDrag={false}
        onChange={onChange}
        // Themed rather than left on the library defaults: an unstyled sheet
        // ships a white background that clashes in dark mode.
        backgroundStyle={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong, width: 40, height: 4 }}
        {...props}
      >
        <BottomSheetView style={{ flex: 1, padding: spacing.md, backgroundColor: colors.surface }}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

BottomModal.displayName = "BottomModal";

export default BottomModal;
