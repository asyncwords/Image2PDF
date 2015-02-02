var Image2PDF = (function () {
    //#endregion 
    //#region Constructor
    function Image2PDF() {
        var _this = this;
        //#region Variables
        // #region Strings    
        this.AddImageText = ko.observable("<i class='fa fa-plus marRight5 color'></i> Image");
        this.ErrorText = ko.observable(JSON.parse(document.getElementById("errorJson").value).Error);
        this.ConvertText = ko.observable("<i class='fa fa-cloud-upload marRight5'></i>Convert to PDF");
        //#endregion 
        //#region Booleans
        this._isAddingImage = ko.observable(false);
        this._isConverting = ko.observable(false);
        this._canUpload = false;
        //#endregion
        //#region Objects and arrays
        this.ImagesToUpload = ko.observableArray([]);
        this._handleImageSourceChange = function (newValue) {
            var target = this;
            if (newValue && newValue !== "#") {
                target.imageIsVisible(true);
            }
            else {
                target.imageIsVisible(false);
            }
        };
        //Set up subscriptions
        this._isAddingImage.subscribe(function (newValue) {
            _this._setAddImageText(newValue);
        });
        this._isConverting.subscribe(function (newValue) {
            _this._setConvertText(newValue);
        });
    }
    Image2PDF.prototype._setAddImageText = function (flag) {
        if (flag) {
            this.AddImageText("<i class='fa fa-spinner fa-spin marRight5 color'></i> Adding");
        }
        else {
            this.AddImageText("<i class='fa fa-plus marRight5 color'></i> Image");
        }
    };
    Image2PDF.prototype._setConvertText = function (flag) {
        if (flag) {
            this.ConvertText("<i class='fa fa-spinner fa-spin marRight5'></i> Converting");
        }
        else {
            this.ConvertText("<i class='fa fa-cloud-upload marRight5'></i>Convert to PDF");
        }
    };
    //#endregion
    //#endregion 
    //#region Handlers
    Image2PDF.prototype.HandleAddImageClick = function (e, f) {
        var _this = this;
        var length = this.ImagesToUpload().length;
        var shouldAddImage = false;
        if (length > 0) {
            var lastImage = this.ImagesToUpload()[length - 1];
            if (lastImage.filename())
                shouldAddImage = true;
        }
        else {
            shouldAddImage = true;
        }
        if (shouldAddImage) {
            this._isAddingImage(true);
            this.ErrorText(null);
            var image = {
                filename: ko.observable(""),
                source: ko.observable("#"),
                imageIsVisible: ko.observable(false)
            };
            image.source.subscribe(this._handleImageSourceChange, image); //Must pass image as second paramter to give access to the proper 'this'
            image.imageIsVisible.subscribe(function (newValue) {
                if (newValue)
                    _this._canUpload = true;
            });
            this.ImagesToUpload.push(image);
            this._isAddingImage(false);
        }
        else {
            this.ErrorText("Please upload all empty images before adding another.");
        }
    };
    Image2PDF.prototype.HandleConvertClick = function (e) {
        var _this = this;
        if (!this._isConverting()) {
            this._isConverting(true);
            this.ErrorText(null);
            var handleFail = function (message) {
                if (!message)
                    message = "Something went wrong and we could not convert your images. Please reload this page and try again.";
                _this.ErrorText(message);
                _this._isConverting(false);
            };
            if (!this._canUpload) {
                handleFail("You must upload at least one image.");
            }
            else {
                //Validate password and username
                var username = $("#username").val();
                var password = $("#password").val();
                if (!username || username.indexOf(".") === -1 || username.indexOf("@") === -1) {
                    handleFail("You must enter a valid email address.");
                }
                else {
                    $.post("/home/checkpassword", { password: password }, function (resp) {
                        if (resp.Success) {
                            document.getElementById("conversionForm").submit();
                        }
                        else {
                            handleFail(resp.Message);
                        }
                    }).fail(function () {
                        handleFail();
                    });
                }
                ;
            }
            ;
        }
        ;
    };
    Image2PDF.prototype.HandleOnFileSelected = function (a, b) {
        //Get files
        var files = b.target.files;
        //Set filename
        a.filename(files.item(0).name);
        //Generate a file preview
        var oFReader = new FileReader();
        oFReader.readAsDataURL(files.item(0));
        oFReader.onload = function (oFREvent) {
            a.source(oFREvent.target.result);
        };
    };
    return Image2PDF;
})();
ko.applyBindings(new Image2PDF());
//# sourceMappingURL=Client.js.map