#!/usr/bin/env perl

# usage: perl kb-fig.pl < kb-uskana-hhkb.json > kb-uskana-hhkb.svg

# 2025-06-09

# --------------------------------------------------------------------
# use

use utf8;
use Encode qw(decode encode);
use JSON;
use SVG;

use strict;
use warnings;

# --------------------------------------------------------------------
# encode/decode

sub enc($) { encode("utf-8", shift); }
sub dec($) { decode("utf-8", shift); }

# --------------------------------------------------------------------
# json

my $json = do { local $/; <> };
my $data = decode_json($json);
my @g_obj = @$data;

# --------------------------------------------------------------------
# svg

my $g_keySizeUnit = 52;
my $g_keySizeUnit1 = 40;
my $g_keyMargin = 1;
my $g_fontSize = 12;

sub do_svg() {
    my $kbdWidth = $g_keySizeUnit * 15;
    my $kbdHeight = $g_keySizeUnit * 5;
    my $kbdMarginH = 10;
    my $kbdMarginV = 10;
    my $canvasWidth = $kbdWidth + $kbdMarginH * 2;
    my $canvasHeight = $kbdHeight + $kbdMarginV * 2;

    my $svg;
    my $g;

    $svg = SVG->new(width => $canvasWidth, height => $canvasHeight);

    $svg->rectangle(x => 0, y => 0, width => $canvasWidth, height => $canvasHeight, rx => 5, ry => 5, style => { "fill" => "#eeeeee" });

    my $fontSize = "${g_fontSize}px";
    my $fontFamily = "system-ui";
    $g = $svg->group(transform => "translate($kbdMarginH, $kbdMarginV)", style => { "font-family" => $fontFamily, "font-size" => $fontSize });

    my $row = 4;
    for (@g_obj) {
        my @ary = @$_;
        my $col = 0;
        my $x = 0;
        my $wd = 1;
        my $ht = 1;
        for (@ary) {
            if (ref($_) eq "HASH") {
                $x = $_->{"x"} || 0;
                $wd = $_->{"w"} if $_->{"w"};
                $ht = $_->{"h"} if $_->{"h"};
                next;
            }
            my @a = split("\n", $_);
            $_ = \@a;
            &svg_putKey($g, $_, $row, $col + $x, $wd, $ht);
            $col += $x + $wd;
            $wd = 1;
            $ht = 1;
        }
        $row -= 1;
    }

    print &enc($svg->xmlify . "\n");

}

my $g_row;
my $g_col;

sub svg_putKey($\@;$$$$$$) {
    my ($g, $ary, $row, $col, $wd, $ht, $bg1, $bg2) = @_;
    $wd = 1.0 unless defined $wd;
    $ht = 1.0 unless defined $ht;
    $bg1 = "#fcfcfc" unless defined $bg1;
    $bg2 = "#cccccc" unless defined $bg2;
    $g_row = $row if defined $row;
    $g_col = $col if defined $col;
    #
    &svg_key($g, $g_row, $g_col, $ary, $wd, $ht, $bg1, $bg2);
    #
    $g_col += $wd;
}

sub svg_key($$$;\@$$$$) {
    my ($g, $row, $col, $ary, $wd, $ht, $bg1, $bg2) = @_;
    $bg1 = "#fcfcfc" unless defined $bg1;
    $bg2 = "#cccccc" unless defined $bg2;
    my $u = $g_keySizeUnit;
    my $m = $g_keyMargin;
    my ($x, $y, $w, $h);
    $x = $col * $u + 0.5;
    $y = (4 - $row) * $u + 0.5;
    $w = $wd * $u - $m;
    $h = $ht * $u - $m;
    $g->rectangle(x => $x, y =>$y, width => $w, height => $h, rx => 5, ry => 5, style => { "fill" => $bg2, "stroke" => "#000000", "stroke-width" => 1 });
    #
    if ($ht == 2) {
        $g->rectangle(x => $x - $u * 0.25, y =>$y, width => $w + $u * 0.25, height => $u - $m, rx => 5, ry => 5, style => { "fill" => $bg2, "stroke" => "#000000", "stroke-width" => 1 });
        $g->rectangle(x => $x + 0.5, y =>$y + 0.5, width => $w - 1, height => $h - 1, rx => 5, ry => 5, style => { "fill" => $bg2, "stroke" => "none", "stroke-width" => 1 });
    }
    #
    my $p = ($g_keySizeUnit - $g_keySizeUnit1) / 2;
    $x += $p;
    $y += $p / 2;
    $w = $wd * $u - $m - $p * 2;
    $h = $g_keySizeUnit1 + ($ht == 2 ? $g_keySizeUnit : 0);
    if ($bg1 && $bg1 ne "none") {
        $g->rectangle(x => $x, y => $y, width => $w, height => $h, rx => 3, ry => 3, style => { "fill" => $bg1 });
        #
        if ($ht == 2) {
            $g->rectangle(x => $x - $u * 0.25, y => $y, width => $w + $u * 0.25, height => $g_keySizeUnit1, rx => 3, ry => 3, style => { "fill" => $bg1 });
        }
        #
    }
    #
    my @a = @$ary;
    my $q = 2;
    my $fillStyle = "#000000";
    $x += $q;
    $y += $q + $g_fontSize;
    my $dy = !$a[1] && @a < 2 ? -($g_keySizeUnit1 / 2 - $q) / 2 : 0;
    $g->text(x => $x, y => $y - $dy)->cdata($a[0]) if 0 < @a && $a[0] ne "";
    $y += $g_keySizeUnit1 / 2 - $q;
    $g->text(x => $x, y => $y)->cdata($a[1]) if 1 < @a && $a[1] ne "";
    $x += $g_keySizeUnit1 / 2 - $q;
    $y -= $g_keySizeUnit1 / 2 - $q;
    $g->text(x => $x, y => $y)->cdata($a[2]) if 2 < @a && $a[2] ne "";
    $y += $g_keySizeUnit1 / 2 - $q;
    $g->text(x => $x, y => $y)->cdata($a[3]) if 3 < @a && $a[3] ne "";
}

# --------------------------------------------------------------------
# output

&do_svg();
