export class CCaptcha {
    static fn_displayCaptcha() {
        var a = Math.ceil(Math.random() * 9) + '';
        var b = Math.ceil(Math.random() * 9) + '';
        var c = Math.ceil(Math.random() * 9) + '';
        var d = Math.ceil(Math.random() * 9) + '';
        var e = Math.ceil(Math.random() * 9) + '';

        var code = a + b + c + d + e;
        //document.getElementById("txtCaptcha").value = code;
        //document.getElementById("CaptchaDiv").innerHTML = code;
    }

    // Validate input against the generated number
    static fn_validCaptcha() {
        var str1 = this.fn_removeSpaces(document.getElementById('txtCaptcha').value);
        var str2 = this.fn_removeSpaces(document.getElementById('CaptchaInput').value);
        if (str1 === str2) {
            return true;
        } else {
            return false;
        }
    }

    // Remove the spaces from the entered and generated code
    static fn_removeSpaces(string) {
        return string.split(' ').join('');
    }
}
