<?php

$im = imagecreatetruecolor(100, 100);

if (!$im) {
    die("Could not create image");
}

imagepng($im, "test.png");
imagedestroy($im);

echo file_exists("test.png") ? "OK" : "FAILED";
