import { Platform, Alert } from 'react-native';

/**
 * Cross-platform alert that works on web and native
 * On web, uses window.confirm for simple confirmations
 * On native, uses Alert.alert
 */
export function showAlert(title, message, buttons = [{ text: 'OK' }]) {
  if (Platform.OS === 'web') {
    // For web, use window methods
    if (buttons.length === 1) {
      // Simple alert
      window.alert(`${title}\n\n${message}`);
      if (buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else if (buttons.length === 2) {
      // Confirmation dialog
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[1].onPress) {
        buttons[1].onPress();
      } else if (!confirmed && buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      // Multiple options - use first two buttons
      const confirmed = window.confirm(`${title}\n\n${message}\n\n(OK = ${buttons[buttons.length - 1].text}, Cancel = ${buttons[0].text})`);
      if (confirmed && buttons[buttons.length - 1].onPress) {
        buttons[buttons.length - 1].onPress();
      } else if (!confirmed && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    // Native - use standard Alert
    Alert.alert(title, message, buttons);
  }
}

/**
 * Simple alert with just OK button
 */
export function showSimpleAlert(title, message, onOk) {
  showAlert(title, message, [{ text: 'OK', onPress: onOk }]);
}

/**
 * Confirmation dialog with Cancel and Confirm buttons
 */
export function showConfirm(title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmStyle = 'default') {
  showAlert(title, message, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    { text: confirmText, style: confirmStyle, onPress: onConfirm }
  ]);
}
