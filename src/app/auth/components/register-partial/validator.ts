import { AbstractControl } from '@angular/forms';

export function passwordValidator(control: AbstractControl) {
  if (control && (control.value !== null || control.value !== undefined)) {
    const cnfPasswordVal = control.value;
    const passControl = control.root.get('password');
    if (passControl) {
      const passVal = passControl.value;
      if (passVal !== cnfPasswordVal) {
        return {
          isError: true
        };
      }
    }
  }

  return null;
}
