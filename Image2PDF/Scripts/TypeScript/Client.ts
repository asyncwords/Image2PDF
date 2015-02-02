module Interfaces {
    export interface KnockoutEvent {
        originalEvent: Event;
        currentTarget: HTMLElement;
        target: HTMLElement;
    }

    export interface ImageToUpload {
        filename: KnockoutObservable<string>;
        source: KnockoutObservable<string>;
        imageIsVisible: KnockoutObservable<boolean>;
    }

    export interface CommonResponse {
        Success: boolean;
        Message: string;
    }
}

class Image2PDF {

    //#region Variables
    
    // #region Strings    
    
    public AddImageText: KnockoutObservable<string> = ko.observable("<i class='fa fa-plus marRight5 color'></i> Image");
    private _setAddImageText(flag: boolean): void {
        if (flag) {
            this.AddImageText("<i class='fa fa-spinner fa-spin marRight5 color'></i> Adding");
        }
        else {
            this.AddImageText("<i class='fa fa-plus marRight5 color'></i> Image");
        }
    }
    private ErrorText: KnockoutObservable<string> = ko.observable(JSON.parse((<HTMLInputElement>document.getElementById("errorJson")).value).Error);
    private ConvertText: KnockoutObservable<string> = ko.observable("<i class='fa fa-cloud-upload marRight5'></i>Convert to PDF");
    private _setConvertText(flag: boolean): void {
        if (flag) {
            this.ConvertText("<i class='fa fa-spinner fa-spin marRight5'></i> Converting");
        }
        else {
            this.ConvertText("<i class='fa fa-cloud-upload marRight5'></i>Convert to PDF");
        }
    }

    //#endregion 

    //#region Booleans

    private _isAddingImage = ko.observable(false);
    private _isConverting = ko.observable(false);
    private _canUpload = false;

    //#endregion

    //#region Objects and arrays
    
    public ImagesToUpload = ko.observableArray<Interfaces.ImageToUpload>([]);

    //#endregion

    //#endregion 

    //#region Handlers

    public HandleAddImageClick(e, f) {
        var length = this.ImagesToUpload().length;
        var shouldAddImage = false;

        if (length > 0) {
            var lastImage = this.ImagesToUpload()[length - 1];

            if (lastImage.filename()) shouldAddImage = true;
        }
        else {
            shouldAddImage = true;
        }

        if (shouldAddImage) {
            this._isAddingImage(true);
            this.ErrorText(null);

            var image: Interfaces.ImageToUpload = {
                filename: ko.observable(""),
                source: ko.observable("#"),
                imageIsVisible: ko.observable(false)
            }

            image.source.subscribe(this._handleImageSourceChange, image); //Must pass image as second paramter to give access to the proper 'this'
            image.imageIsVisible.subscribe((newValue) => {
                if(newValue) this._canUpload = true;
            });

            this.ImagesToUpload.push(image);

            this._isAddingImage(false);
        }
        else {
            this.ErrorText("Please upload all empty images before adding another.");
        }
    }

    private _handleImageSourceChange = function (newValue: string) {
        var target: Interfaces.ImageToUpload = this;

        if (newValue && newValue !== "#") {
            target.imageIsVisible(true);
        } else {
            target.imageIsVisible(false);
        }
    }

    public HandleConvertClick(e) {
        if (!this._isConverting()) {
            this._isConverting(true);
            this.ErrorText(null);

            var handleFail = (message?: string) => {
                if (!message) message = "Something went wrong and we could not convert your images. Please reload this page and try again.";

                this.ErrorText(message);
                this._isConverting(false);
            };

            if (!this._canUpload) {
                handleFail("You must upload at least one image.");
            }
            else {
                //Validate password and username
                var username: string = $("#username").val();
                var password: string = $("#password").val();

                if (!username || username.indexOf(".") === -1 || username.indexOf("@") === -1) {
                    handleFail("You must enter a valid email address.");
                }
                else {
                    $.post("/home/checkpassword", { password: password },(resp: Interfaces.CommonResponse) => {
                        if (resp.Success) {
                            (<HTMLFormElement>document.getElementById("conversionForm")).submit();
                        }
                        else {
                            handleFail(resp.Message);
                        }
                    }).fail(() => { handleFail(); });
                };
            };
        };
    }

    public HandleOnFileSelected(a: Interfaces.ImageToUpload, b: Interfaces.KnockoutEvent) {
        //Get files
        var files = (<HTMLInputElement>b.target).files;

        //Set filename
        a.filename(files.item(0).name);
        
        //Generate a file preview
        var oFReader = new FileReader();
        oFReader.readAsDataURL(files.item(0));
        oFReader.onload = function (oFREvent) {
            a.source((<any>oFREvent.target).result);
        };
    }

    //#endregion 

    //#region Constructor

    constructor() {
        //Set up subscriptions
        this._isAddingImage.subscribe((newValue: boolean) => {
            this._setAddImageText(newValue);
        });
        this._isConverting.subscribe((newValue: boolean) => {
            this._setConvertText(newValue);
        });
    }

    //#endregion
}

ko.applyBindings(new Image2PDF());