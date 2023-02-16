/**********************************************************************
    FCIV.NET - the web version of Freeciv. https://www.fciv.net/
    Copyright (C) 2023 FCIV.NET

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

***********************************************************************/


/**************************************************************************
 Logs JavaScript error in FCIV.NET DB.
**************************************************************************/
function errorlog_callback(stackframes)
{
    var stringifiedStack = stackframes.map(function(sf) {
        return sf.toString();
    }).join('\n');
    $.post("/errorlog?stacktrace=" + stringifiedStack).fail(function() {});
    console.log(stringifiedStack);

}

/**************************************************************************
 Logs error message.
**************************************************************************/
function errback(err)
{
  console.log(err.message);
}


window.onerror = function(msg, file, line, col, error) {
    StackTrace.fromError(error).then(errorlog_callback).catch(errback);
    $.post("/errorlog?stacktrace=" + msg).fail(function() {});
};