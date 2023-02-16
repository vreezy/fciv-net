<%@ page import="java.util.Properties" %>
<%@ page import="java.io.IOException" %>
<%@ page import="static org.apache.commons.lang3.StringUtils.stripToNull" %>
<%@ page import="static org.apache.commons.lang3.StringUtils.stripToEmpty" %>
<%@ page import="static java.lang.Boolean.parseBoolean" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%
String gaTrackingId = null;
String googleSigninClientKey = null;
String trackJsToken = null;
String captchaKey = null;
boolean fcwDebug = false;
try {
  Properties prop = new Properties();
  prop.load(getServletContext().getResourceAsStream("/WEB-INF/config.properties"));
  gaTrackingId = stripToNull(prop.getProperty("ga-tracking-id"));
  googleSigninClientKey = stripToEmpty(prop.getProperty("google-signin-client-key"));
  trackJsToken = stripToNull(prop.getProperty("trackjs-token"));
  captchaKey = stripToEmpty(prop.getProperty("captcha_public"));

  String debugParam = request.getParameter("debug");
  fcwDebug = (debugParam != null && (debugParam.isEmpty() || parseBoolean(debugParam)));
} catch (IOException e) {
  e.printStackTrace();
}
%>
<!DOCTYPE html>
<html>
<head>
<title>Fciv.net 3D - play Freeciv in 3D online for free; open source strategy game!</title>
<link rel="stylesheet" href="/css/font-awesome.min.css">
<link rel="stylesheet" type="text/css" href="/css/webclient.min.css?ts=${initParam.buildTimeStamp}" />
<meta name="description" content="Fciv.net - play Freeciv in 3D online for free; open source strategy game">
<meta property="og:image" content="https://fciv.net/static/images/freeciv-webgl-splash-48.png" />
<% if (trackJsToken != null) { %>
<script type="text/javascript">window._trackJs = { token: '<%= trackJsToken %>' };</script>
<script type="text/javascript" src="https://cdn.trackjs.com/releases/current/tracker.js"></script>
<% } %>
<script type="text/javascript">
var ts="${initParam.buildTimeStamp}";
var fcwDebug=<%= fcwDebug %>;
</script>
<script type="text/javascript" src="/javascript/libs/jquery.min.js?ts=${initParam.buildTimeStamp}"></script>

<script src="https://apis.google.com/js/platform.js"></script>

<script type="text/javascript" src="/javascript/libs/stacktrace.min.js"></script>

<script type="text/javascript" src="/javascript/libs/handlebars.runtime.js?ts=${initParam.buildTimeStamp}"></script>

<script type="text/javascript" src="/javascript/webgl/libs/three.min.js?ts=${initParam.buildTimeStamp}"></script>

<script type="text/javascript" src="/javascript/webclient.min.js?ts=${initParam.buildTimeStamp}"></script>

<script type="text/javascript" src="/music/audio.min.js"></script>

<link rel="shortcut icon" href="/images/freeciv-shortcut-icon.png" />
<link rel="apple-touch-icon" href="/images/freeciv-splash2.png" />

<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, minimal-ui" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

<meta name="google-signin-client_id" content="<%= googleSigninClientKey %>">
<link rel="manifest" href="/static/manifest.json">

<script>var captcha_site_key = '<%= captchaKey %>';</script>
<script src="https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit"
    async defer>
</script>

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-35GD0T4L9J"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-35GD0T4L9J');
</script>

</head>

<body>
    <jsp:include page="pregame.jsp" flush="false"/>
    <jsp:include page="game.jsp" flush="false"/>

</body>

<script id="terrain_fragment_shh" type="x-shader/x-fragment">
  <jsp:include page="/javascript/webgl/shaders/terrain_fragment_shader.glsl" flush="false"/>
</script>

<script id="terrain_vertex_shh" type="x-shader/x-vertex">
  <jsp:include page="/javascript/webgl/shaders/terrain_vertex_shader.glsl" flush="false"/>
</script>

</html>
