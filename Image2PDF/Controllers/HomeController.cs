using Image2PDF.Models;
using iTextSharp.text;
using System;
using System.IO;
using System.Web;
using System.Web.Mvc;
using SendGrid;
using iTextSharp.text.pdf;
using System.Net;
using System.Net.Mail;

namespace Image2PDF.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index(string username, string error)
        {
            ViewBag.Title = "Convert your images to PDF";
            ViewBag.Username = username;
            ViewBag.Error = error;

            return View();
        }

        public JsonResult CheckPassword(string password)
        {
			return Json(this._CheckPassword(password), JsonRequestBehavior.AllowGet);
        }
		
		private CommonResponse _CheckPassword(string password){			
            var output = new CommonResponse()
            {
                Success = false,
                Message = "Incorrect password."
            };

            if (password == System.Configuration.ConfigurationManager.AppSettings.Get("ConversionPassword"))
            {
                output.Success = true;
            }

            return output;
		}

        public ActionResult Convert(string username, string password)
        {
            var validate = this._CheckPassword(password);

            if (!validate.Success)
            {
                return RedirectToAction("Index", new { username = username, error = validate.Message });
            }
            else
            {
				using (var stream = new MemoryStream())
				{
					var doc = new Document();
					PdfWriter.GetInstance(doc, stream);
					doc.Open();

					var firstPage = true;

					foreach (string fileName in Request.Files)
					{
						HttpPostedFileBase file = Request.Files[fileName];
						
						if (!firstPage)
						{
							doc.NewPage();
						}
						else
						{
							firstPage = false;
						}

						//Following line throws an exception "Index was outside the bounds of the array."
						doc.Add(Image.GetInstance(file.InputStream));
					}
					
					var send = this.Send(username, stream);
					
					if(!send.Success){
						return RedirectToAction("Index", new { username = username, error = send.Message });
					}
					else{
						return RedirectToAction("ConvertSuccess", new { username = username});
					}

					doc.Close();				
				}
            }
        }
		
		public CommonResponse Send(string recipient, Stream stream)
        {
			var output = new CommonResponse{
				Message = "Failed to send PDF to " + recipient,
				Success = false
			};
			
            try {
                // Create the email object first, then add the properties.
                var myMessage = new SendGridMessage();

                // Add the message properties.
                myMessage.From = new MailAddress("joshua@asyncbuild.com", "Image2PDF");
                myMessage.AddTo(recipient);
                myMessage.Subject = "Your images have been converted to PDF!";

                //Add the HTML and Text bodies
                myMessage.Html = "<p>Thank you for using Image2PDF! Your images have been converted to a PDF document, which you will find attached to this email.</p>";
                myMessage.Text = "Thank you for using Image2PDF! Your images have been converted to a PDF document, which you will find attached to this email.";

                //Attach the PDF
                myMessage.AddAttachment(stream, DateTime.Now.ToString("Image2PDF_MMM-dd-yyyy-hh-mm-ss") + ".pdf");

                // Create network credentials to access your SendGrid account.
                var credentials = new NetworkCredential("Rakathos", "inmYp4lac3de3p");

                // Create an Web transport for sending email.
                var transportWeb = new Web(credentials);

                // Send the email.
                transportWeb.Deliver(myMessage);

                output.Success = true;
            }
            catch(Exception e)
            {
                output.Message = e.Message;
            }
			
			return output;
        }
		
		public ActionResult ConvertSuccess(string username){
			ViewBag.Title = "Your PDF has been converted!";
			ViewBag.Username = username;
			
			return View();
		}
    }
}