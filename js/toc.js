var ToC =
  "<nav role='navigation' class='table-of-contents'>" +
    "<h2>Table of Contents:</h2>" +
    "<ul>";

var newLine, el, title, link;

$("article h3").each(function() {
  el = $(this);
  title = el.text();
  link = "#" + el.attr("id");

  newLine =
    "<li>" +
      "<a href='" + link + "'>" +
        title +
      "</a>" +
    "</li>";

  ToC += newLine;
});

ToC +=
   "</ul>" +
  "</nav>";

$(".algorithm-topics").prepend(ToC);
