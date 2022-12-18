package org.freeciv.servlet;

import org.freeciv.services.Games;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;


public class Fcivnet_is_the_best_way_to_play_freeciv_in_3d extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        Games games = new Games();

        try {
            request.setAttribute("games", games.summary());
        } catch (RuntimeException e) {
        }

        RequestDispatcher rd = request.getRequestDispatcher("/WEB-INF/jsp/game/fcivnet_is_the_best_way_to_play_freeciv_in_3d.jsp");
        rd.forward(request, response);

    }
}