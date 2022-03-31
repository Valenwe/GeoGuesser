<?php
$file = __DIR__ . '/scoreboard.json';
$podium = array();
$colors = array(
    "blue", "red", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chocolate",
    "Coral", "Cyan", "DarkBlue", "DarkMagenta", "DarkRed", "Green", "LawnGreen", 
    "MediumPurple", "Pink", "SlateBlue", "Tomato", "Yellow"
);

if (file_exists($file)) {
    $data = file_get_contents($file, true);
    $obj = json_decode(json_encode(json_decode($data)), true);

    if (isset($obj["total_time"], $obj["game_count"], $obj["games"])) {
        $total_time = $obj["total_time"];
        $total_time = $total_time / 1000;
        $hours = (int) date("H", $total_time) - 2;
        $minutes = date("i", $total_time);
        $seconds = date("s", $total_time);
    
        $total_time_str = $hours . " H " . $minutes . " M " . $seconds . " S";
    
        usort($obj["games"], function ($a, $b) {
            return $a["score"] <= $b["score"];
        });
    
        $i = 0;
        while (count($podium) < 10 && count($podium) < count($obj["games"])) {
            array_push($podium, $obj["games"][$i]);
            $i++;
        }
    }
}

?>

<!DOCTYPE html>
<html>

<head>
    <title>GeoGuesser 2.1 - Scoreboard</title>
    <meta charset="UTF-8">
    <link rel="shortcut icon" type="image/png" href="favicon.png" />
    <style type="text/css">
        @font-face {
            font-family: "Arcade";
            src: url("arcade_font.ttf") format("truetype");
            font-weight: normal;
            font-style: normal;
        }

        button {
            width: 110px;
            height: 25px;
            border-radius: 5px;
            color: white;
            background-color: rgb(103, 37, 165);
            font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
            font-weight: bold;
        }

        button:hover {
            border-radius: unset;
            background-color: rgb(153, 44, 255);
        }

        html,
        body {
            height: 100%;
            text-align: center;
            color: wheat;
            font-family: "Arcade";
            background-color: black;
        }

        table {
            margin-left: auto;
            margin-right: auto;
        }

        th,
        td {
            padding-top: 0px;
            padding-bottom: 10px;
            padding-left: 30px;
            padding-right: 40px;
            font-size: 25px;
        }

        th,
        h2 {
            color: darkorchid;
            font-size: 30px;
        }
    </style>
</head>

<body>
    <button onclick="window.history.back()">Back</button>
    <?php if (!empty($podium)) : ?>
        <h2>Game count: <?php echo "<span style='color:" . $colors[rand(0, count($colors) - 1)] . "'>" . $obj["game_count"] . "<span>" ?></h2>
        <h2>Total time: <?php echo "<span style='color:" . $colors[rand(0, count($colors) - 1)] . "'>" . $total_time_str . "<span>" ?></h2>
        <table>
            <tr>
                <th>Pseudo</th>
                <th>Score</th>
            </tr>
            <?php
            foreach ($podium as $game) {
                $color = rand(0, count($colors) - 1);
                echo "<tr>";
                echo "<td style='color:" . $colors[$color] . "'>" . $game["pseudo"] . "</td>";
                echo "<td style='color:" . $colors[$color] . "'>" . $game["score"] . "</td>";
                echo "</tr>";
            } ?>
        </table>
    <?php endif ?>
    <?php if (empty($podium)) : ?>
        <?php
        echo "<h2>Il n'y a pas de score enregistré pour le moment</h2>";
        ?>
    <?php endif ?>

</body>

</html>