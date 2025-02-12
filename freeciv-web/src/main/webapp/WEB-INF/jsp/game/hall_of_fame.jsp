<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>
<%@ taglib prefix = "fmt" uri = "http://java.sun.com/jsp/jstl/fmt" %>

<%@ include file="/WEB-INF/jsp/fragments/i18n.jsp"%>
<!DOCTYPE html>
<html lang="en">
<head>
<%@include file="/WEB-INF/jsp/fragments/head.jsp"%>

<!-- Bootstrap core CSS -->
<link rel="stylesheet" href="/css/morris.css" />

<style>
	table, th, td {
        padding: 4px;
        font-size: 130%;
        text-transform: capitalize;
    }

    .score_row {
      border-bottom: 1px solid black;
    }

</style>

</head>
<body>
	<%@include file="/WEB-INF/jsp/fragments/header.jsp" %>


	<div class="container">

 		<div class="row">
     			<div class="col-md-12">

		<h1>Hall Of Fame</h1>
		These are the greatest players of Freeciv-web! Each row shows the result of one game.
        <br>

        <table style="width: 100%;">
             <tr>
                <th>Rank:</th>
                <th>Name:</th>
                <th>Nation:</th>
                <th>End turn:</th>
                <th>End date:</th>
                <th title="Score of this player in all games">Score (all):</th>
                <th title="Score of this player in this game">Score:</th>
                <th>Map:</th>
              </tr>
            <c:forEach items="${data}" var="item">
              <tr class="score_row">
                <td title="The rank of the game score compared to other game scores"><c:out value="${item.position}"/></td>
                <td title="Player name"><c:out value="${item.username}"/></td>
                <td title="Nation"><c:out value="${item.nation}"/></td>
                <td style="text-align: right;" title="Turn when the game ended"><c:out value="${item.end_turn}"/></td>
                <td title="Date when the game ended"><c:out value="${item.end_date}"/></td>
                <td style="text-align: right;" title="Score of this player in all games"><c:out value="${item.total_score}"/></td>
                <td style="text-align: right;" title="Score of this player in this game"><c:out value="${item.score}"/></td>
                <td>
                        <a href="/data/mapimgs/<c:out value="${item.id}"/>.gif">
                            <img src="/data/mapimgs/<c:out value="${item.id}"/>.gif" width="70" height="40">
                        </a>
                </td>
              </tr>
            </c:forEach>
        </table>
        <br><br><br>
    			</div>
    		</div>

    		
		<!-- Site footer -->
		<%@include file="/WEB-INF/jsp/fragments/footer.jsp"%>
	</div> <!-- container -->
</body>
</html>
