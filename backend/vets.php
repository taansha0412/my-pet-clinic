<?php
require 'config.php';
out(db()->query('SELECT id, name, specialty FROM vets ORDER BY name')->fetchAll());