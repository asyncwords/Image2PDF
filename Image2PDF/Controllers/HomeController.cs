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
using Mandrill;
using System.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;

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

        private CommonResponse _CheckPassword(string password)
        {
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
                    //Create doc with no margins
                    var doc = new Document();
                    doc.SetMargins(0, 0, 0, 0);

                    //Get a writer and open document
                    PdfWriter.GetInstance(doc, stream);
                    doc.Open();

                    foreach (string fileName in Request.Files)
                    {
                        HttpPostedFileBase file = Request.Files[fileName];

                        //Get and scale image
                        var image = Image.GetInstance(file.InputStream);
                        image.ScaleToFit(doc.PageSize);

                        //Add image to PDF
                        doc.Add(image);
                        doc.NewPage();
                    }

                    doc.Close();

                    //Must call doc.close to send a valid PDF, but this closes the stream too. Clone it to send.
                    using (var clonedStream = new MemoryStream(stream.ToArray()))
                    {
                        clonedStream.Position = 0;

                        //Send PDF to user
                        var send = this.Send(username, clonedStream);
                        if (!send.Success)
                        {
                            return RedirectToAction("Index", new { username = username, error = send.Message });
                        }
                        else
                        {
                            return RedirectToAction("ConvertSuccess", new { username = username });
                        }
                    }
                }
            }
        }

        public async Task<CommonResponse> Send(string recipient, Stream stream)
        {
            var output = new CommonResponse
            {
                Message = "Failed to send PDF to " + recipient,
                Success = false
            };

            try
            {
                var mandrill = new MandrillApi(ConfigurationManager.AppSettings.Get("MandrillApiKey"));

                //Create attachment
                var attachment = new email_attachment()
                {
                    name = string.Format("Image2PDF_{0}.pdf", DateTime.Now.ToString("MMM-dd-yyyy-hh-mm-ss")),
                    type = "application/pdf",
                    content = "" //Convert.ToBase64String(stream)
                };

                //Create email
                var email = new EmailMessage()
                {
                    from_email = "joshua@asyncbuild.com",
                    from_name = "Image2PDF",
                    to = new List<EmailAddress>() { new EmailAddress(recipient) },
                    subject = "[Image2PDF] Your images have been converted to PDF!",
                    html = "<p>Thank you for using Image2PDF! Your images have been converted to a PDF document, which you will find attached to this email.</p>",
                    text = "Thank you for using Image2PDF! Your images have been converted to a PDF document, which you will find attached to this email.",
                    attachments = new List<email_attachment>() { attachment }
                };

                var send = await mandrill.SendMessageAsync(email);

                output.Success = true;
            }
            catch (Exception e)
            {
                output.Message = e.Message;
            }

            return output;
        }

        public ActionResult ConvertSuccess(string username)
        {
            ViewBag.Title = "Your PDF has been converted!";
            ViewBag.Username = username;

            return View();
        }
    }
}